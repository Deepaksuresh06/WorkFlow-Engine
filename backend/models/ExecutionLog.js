const mongoose = require('mongoose');

const StepLogSchema = new mongoose.Schema({
  stepId:      String,
  stepName:    String,
  stepType:    String,
  status:      { type: String, enum: ['pending','running','completed','failed','skipped'] },
  attempt:     { type: Number, default: 1 },
  startedAt:   Date,
  completedAt: Date,
  durationMs:  Number,
  output:      mongoose.Schema.Types.Mixed,
  error:       { message: String, code: String },
}, { _id: false });

const ExecutionLogSchema = new mongoose.Schema({
  workflowId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
  workflowName: { type: String },
  status:       { type: String, enum: ['pending','running','completed','failed','cancelled'], default: 'pending' },
  context:      { type: mongoose.Schema.Types.Mixed, default: {} },
  stepLogs:     { type: [StepLogSchema], default: [] },
  startedAt:    Date,
  completedAt:  Date,
  durationMs:   Number,
  cancelReason: String,
  retryOf:      { type: mongoose.Schema.Types.ObjectId, ref: 'ExecutionLog' },
}, { timestamps: true });

ExecutionLogSchema.index({ workflowId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ExecutionLog', ExecutionLogSchema);
