const Rule = require('../models/Rule');

const list   = async (q = {}) => Rule.find(q).sort({ priority: -1 });
const create = async (d)      => Rule.create(d);
const update = async (id, d)  => {
  const r = await Rule.findByIdAndUpdate(id, d, { new: true, runValidators: true });
  if (!r) { const e = new Error('Rule not found'); e.statusCode = 404; throw e; }
  return r;
};
const remove = async (id)     => {
  const r = await Rule.findByIdAndDelete(id);
  if (!r) { const e = new Error('Rule not found'); e.statusCode = 404; throw e; }
};

module.exports = { list, create, update, remove };
