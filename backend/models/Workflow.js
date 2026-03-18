const mongoose = require('mongoose');

const StepSchema = new mongoose.Schema({
  stepId:      { type: String, required: true },
  name:        { type: String, required: true },
  type:        { type: String, enum: ['task', 'approval', 'notification'], required: true },
  order:       { type: Number, required: true },
  description: { type: String, default: '' },
  handler:     { type: String, default: 'log' },
  rules: [{
    ruleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Rule' },
    _id: false,
  }],
  rulesLogic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  retry: {
    maxAttempts: { type: Number, default: 3 },
    backoffMs:   { type: Number, default: 1000 },
  },
}, { _id: false });

const WorkflowSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  status:       { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  steps:        { type: [StepSchema], default: [] },
  tags:         [String],
  triggerCount: { type: Number, default: 0 },
}, { timestamps: true });

WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ name: 'text' });

module.exports = mongoose.model('Workflow', WorkflowSchema);
