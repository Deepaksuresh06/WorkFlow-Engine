const resolvePath = (obj, path) =>
  path.split('.').reduce((acc, k) => acc?.[k], obj);

const evalCondition = (cond, ctx) => {
  const val = resolvePath(ctx, cond.field);
  switch (cond.operator) {
    case 'eq':       return val == cond.value;
    case 'neq':      return val != cond.value;
    case 'gt':       return val > cond.value;
    case 'gte':      return val >= cond.value;
    case 'lt':       return val < cond.value;
    case 'lte':      return val <= cond.value;
    case 'contains': return String(val).includes(cond.value);
    case 'exists':   return val !== undefined && val !== null;
    default:         return false;
  }
};

const evaluateRule = (rule, ctx) => {
  const results = rule.conditions.map(c => evalCondition(c, ctx));
  const passed  = rule.conditionLogic === 'OR' ? results.some(Boolean) : results.every(Boolean);
  return { passed, rule };
};

module.exports = { evaluateRule };
