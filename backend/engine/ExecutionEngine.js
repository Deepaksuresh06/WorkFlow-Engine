const ExecutionLog = require('../models/ExecutionLog');
const Rule         = require('../models/Rule');
const { evaluateRule } = require('./RuleEngine');
const logger = require('../utils/logger');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Run a single step ────────────────────────────────────────────────────────
const runStep = async (step, context) => {
  logger.info(`  Running step [${step.type}]: ${step.name}`);
  await sleep(300 + Math.random() * 400);
  if (step.handler === 'fail_test') {
    throw new Error('Step intentionally failed (fail_test handler)');
  }
  return { success: true, handler: step.handler, processedAt: new Date() };
};

// ── Check if a rule fires for this step ──────────────────────────────────────
const checkRule = async (step, context) => {
  if (!step.ruleId) return null;

  const rule = await Rule.findById(step.ruleId);
  if (!rule || !rule.isActive) return null;

  const { passed } = evaluateRule(rule, context);
  if (!passed) return null;

  logger.info(`  Rule matched: "${rule.name}" → action: ${rule.action}`);
  return rule;
};

// ── Main execution orchestrator ──────────────────────────────────────────────
const execute = async (executionId) => {
  const log = await ExecutionLog.findById(executionId).populate('workflowId');
  if (!log) throw new Error(`ExecutionLog not found: ${executionId}`);
  if (log.status === 'cancelled') return;

  const workflow = log.workflowId;
  const steps    = [...(workflow.steps || [])].sort((a, b) => a.order - b.order);

  logger.info(`[Engine] Starting execution ${executionId} — "${workflow.name}" (${steps.length} steps)`);

  await ExecutionLog.findByIdAndUpdate(executionId, {
    status: 'running',
    startedAt: new Date(),
  });

  let context = { ...(log.context || {}) };

  for (const step of steps) {
    // Check for cancellation between steps
    const fresh = await ExecutionLog.findById(executionId).select('status');
    if (fresh.status === 'cancelled') {
      logger.info(`[Engine] Execution cancelled mid-run`);
      return;
    }

    const stepStart = Date.now();

    // ── Check rule BEFORE running the step ──────────────────────────────────
    const matchedRule = await checkRule(step, context);

    if (matchedRule) {
      if (matchedRule.action === 'skip_step') {
        logger.info(`  Skipping step "${step.name}" — rule: ${matchedRule.name}`);
        await ExecutionLog.updateOne({ _id: executionId }, {
          $push: {
            stepLogs: {
              stepId:      step.stepId,
              stepName:    step.name,
              stepType:    step.type,
              status:      'skipped',
              startedAt:   new Date(),
              completedAt: new Date(),
              durationMs:  0,
              output:      { skippedBy: matchedRule.name, reason: `Rule action: ${matchedRule.action}` },
            },
          },
        });
        continue; // move to next step
      }

      if (matchedRule.action === 'deny') {
        logger.warn(`  Step "${step.name}" DENIED by rule: ${matchedRule.name}`);
        await ExecutionLog.updateOne({ _id: executionId }, {
          $push: {
            stepLogs: {
              stepId:      step.stepId,
              stepName:    step.name,
              stepType:    step.type,
              status:      'failed',
              startedAt:   new Date(),
              completedAt: new Date(),
              durationMs:  0,
              error:       { message: `Denied by rule: ${matchedRule.name}`, code: 'RULE_DENIED' },
            },
          },
        });
        await ExecutionLog.findByIdAndUpdate(executionId, {
          status: 'failed', completedAt: new Date(),
        });
        return;
      }

      if (matchedRule.action === 'notify') {
        logger.info(`  Rule "${matchedRule.name}" triggered notify action for step "${step.name}"`);
        // In production: send email/webhook here
        // Step still continues after notify
      }
    }

    // ── Push step as running ─────────────────────────────────────────────────
    await ExecutionLog.updateOne({ _id: executionId }, {
      $push: {
        stepLogs: {
          stepId:    step.stepId,
          stepName:  step.name,
          stepType:  step.type,
          status:    'running',
          attempt:   1,
          startedAt: new Date(),
        },
      },
    });

    // ── Run with retry ───────────────────────────────────────────────────────
    let success   = false;
    let lastError = null;
    const maxAttempts = step.retry?.maxAttempts || 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          logger.info(`  Retry attempt ${attempt}/${maxAttempts} for "${step.name}"`);
          await sleep((step.retry?.backoffMs || 1000) * Math.pow(2, attempt - 2));
          await ExecutionLog.updateOne(
            { _id: executionId, 'stepLogs.stepId': step.stepId },
            { $set: { 'stepLogs.$.attempt': attempt, 'stepLogs.$.status': 'running' } }
          );
        }
        const output = await runStep(step, context);
        context = { ...context, [`${step.stepId}_output`]: output };
        success = true;
        break;
      } catch (err) {
        lastError = err;
        logger.warn(`  Step "${step.name}" attempt ${attempt} failed: ${err.message}`);
      }
    }

    const durationMs = Date.now() - stepStart;

    if (success) {
      await ExecutionLog.updateOne(
        { _id: executionId, 'stepLogs.stepId': step.stepId },
        {
          $set: {
            'stepLogs.$.status':      'completed',
            'stepLogs.$.completedAt': new Date(),
            'stepLogs.$.durationMs':  durationMs,
            'stepLogs.$.output':      { handler: step.handler, ruleApplied: matchedRule?.name || null },
          },
        }
      );
      logger.info(`  ✓ Step "${step.name}" completed in ${durationMs}ms`);
    } else {
      await ExecutionLog.updateOne(
        { _id: executionId, 'stepLogs.stepId': step.stepId },
        {
          $set: {
            'stepLogs.$.status':      'failed',
            'stepLogs.$.completedAt': new Date(),
            'stepLogs.$.durationMs':  durationMs,
            'stepLogs.$.error':       { message: lastError?.message, code: 'STEP_FAILED' },
          },
        }
      );
      await ExecutionLog.findByIdAndUpdate(executionId, {
        status: 'failed', completedAt: new Date(),
        durationMs: Date.now() - new Date(log.startedAt || Date.now()),
      });
      logger.error(`[Engine] Execution FAILED at step: "${step.name}"`);
      return;
    }
  }

  const completedAt = new Date();
  const durationMs  = completedAt - new Date(log.startedAt || completedAt);

  await ExecutionLog.findByIdAndUpdate(executionId, {
    status: 'completed', completedAt, durationMs,
  });
  await require('../models/Workflow').findByIdAndUpdate(workflow._id, {
    $inc: { triggerCount: 1 },
  });

  logger.info(`[Engine] ✓ Execution ${executionId} COMPLETED in ${durationMs}ms`);
};

module.exports = { execute };
