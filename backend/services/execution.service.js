const ExecutionLog = require('../models/ExecutionLog');
const { enqueueExecution } = require('../queues/execution.queue');

const listAll = async ({ status, page = 1, limit = 20 }) => {
  const q = {};
  if (status) q.status = status;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    ExecutionLog.find(q)
      .populate('workflowId', 'name')
      .sort({ createdAt: -1 }).skip(skip).limit(+limit)
      .select('-stepLogs'),
    ExecutionLog.countDocuments(q),
  ]);
  return { data, total };
};

const get = async (id) => {
  const log = await ExecutionLog.findById(id).populate('workflowId', 'name');
  if (!log) { const e = new Error('Execution not found'); e.statusCode = 404; throw e; }
  return log;
};

const cancel = async (id, reason) => {
  const log = await ExecutionLog.findById(id);
  if (!log) { const e = new Error('Execution not found'); e.statusCode = 404; throw e; }
  if (!['pending','running'].includes(log.status)) {
    const e = new Error(`Cannot cancel execution with status: ${log.status}`);
    e.statusCode = 400; throw e;
  }
  return ExecutionLog.findByIdAndUpdate(id,
    { status: 'cancelled', completedAt: new Date(), cancelReason: reason || 'Manual cancel' },
    { new: true }
  );
};

const retry = async (id) => {
  const original = await ExecutionLog.findById(id).populate('workflowId');
  if (!original) { const e = new Error('Execution not found'); e.statusCode = 404; throw e; }
  if (original.status !== 'failed') {
    const e = new Error('Only failed executions can be retried'); e.statusCode = 400; throw e;
  }
  const newLog = await ExecutionLog.create({
    workflowId:   original.workflowId._id,
    workflowName: original.workflowName,
    status:       'pending',
    context:      original.context,
    retryOf:      original._id,
  });
  await enqueueExecution(String(newLog._id));
  return newLog;
};

const stepLogs = async (id) => {
  const log = await ExecutionLog.findById(id).select('stepLogs status');
  if (!log) { const e = new Error('Execution not found'); e.statusCode = 404; throw e; }
  return log.stepLogs;
};

module.exports = { listAll, get, cancel, retry, stepLogs };
