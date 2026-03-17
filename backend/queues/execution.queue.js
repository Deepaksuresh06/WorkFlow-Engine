const { execute } = require('../engine/ExecutionEngine');
const logger = require('../utils/logger');

const enqueueExecution = async (executionId, options = {}) => {
  logger.info(`[Queue] Enqueued execution: ${executionId}`);
  setImmediate(async () => {
    try {
      if (options.delay) await new Promise((r) => setTimeout(r, options.delay));
      await execute(executionId);
    } catch (err) {
      logger.error(`[Queue] Execution ${executionId} failed: ${err.message}`);
    }
  });
  return { id: executionId };
};

module.exports = { enqueueExecution };
