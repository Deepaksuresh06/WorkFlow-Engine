const Workflow    = require('../models/Workflow');
const ExecutionLog = require('../models/ExecutionLog');
const { enqueueExecution } = require('../queues/execution.queue');
const { v4: uuidv4 } = require('uuid');

const list = async ({ status, search, page = 1, limit = 20 }) => {
  const q = {};
  if (status) q.status = status;
  if (search) q.$text  = { $search: search };
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    Workflow.find(q).sort({ updatedAt: -1 }).skip(skip).limit(+limit),
    Workflow.countDocuments(q),
  ]);
  return { data, total };
};

const create = async (body) => {
  const steps = (body.steps || []).map((s, i) => ({
    ...s,
    stepId: s.stepId || uuidv4(),
    order:  s.order !== undefined ? s.order : i,
  }));
  return Workflow.create({ ...body, steps });
};

const get = async (id) => {
  const wf = await Workflow.findById(id);
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  return wf;
};

const update = async (id, body) => {
  const wf = await Workflow.findById(id);
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  if (body.steps) {
    body.steps = body.steps.map((s, i) => ({
      ...s,
      stepId: s.stepId || uuidv4(),
      order:  s.order !== undefined ? s.order : i,
    }));
  }
  Object.assign(wf, body);
  return wf.save();
};

const remove = async (id) => {
  const wf = await Workflow.findByIdAndDelete(id);
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  await ExecutionLog.deleteMany({ workflowId: id });
};

const trigger = async (id, context = {}) => {
  const wf = await Workflow.findById(id);
  if (!wf) { const e = new Error('Workflow not found'); e.statusCode = 404; throw e; }
  if (wf.status !== 'active') {
    const e = new Error('Only active workflows can be triggered. Publish it first.');
    e.statusCode = 400; throw e;
  }

  const log = await ExecutionLog.create({
    workflowId:   id,
    workflowName: wf.name,
    status:       'pending',
    context,
  });

  await enqueueExecution(String(log._id));
  return log;
};

const listExecutions = async (workflowId, { status, page = 1, limit = 20 }) => {
  const q = { workflowId };
  if (status) q.status = status;
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    ExecutionLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(+limit),
    ExecutionLog.countDocuments(q),
  ]);
  return { data, total };
};

module.exports = { list, create, get, update, remove, trigger, listExecutions };
