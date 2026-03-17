const mongoose = require('mongoose');

const RuleSchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true },
  description:    { type: String, default: '' },
  priority:       { type: Number, default: 0 },
  conditionLogic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  conditions: [{
    field:    { type: String, required: true },
    operator: { type: String, enum: ['eq','neq','gt','gte','lt','lte','contains','exists'], required: true },
    value:    mongoose.Schema.Types.Mixed,
    _id: false,
  }],
  action:   { type: String, enum: ['allow','deny','skip_step','notify'], required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Rule', RuleSchema);
