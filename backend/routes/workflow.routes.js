const router  = require('express').Router();
const svc     = require('../services/workflow.service');
const execSvc = require('../services/execution.service');
const { success, paginated } = require('../utils/apiResponse');

router.get('/', async (req, res, next) => {
  try {
    const { data, total } = await svc.list(req.query);
    paginated(res, data, total, req.query.page || 1, req.query.limit || 20);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try { success(res, await svc.create(req.body), 'Workflow created', 201); }
  catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { success(res, await svc.get(req.params.id)); }
  catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try { success(res, await svc.update(req.params.id, req.body), 'Updated'); }
  catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try { await svc.remove(req.params.id); success(res, null, 'Deleted'); }
  catch (e) { next(e); }
});

// Trigger execution
router.post('/:id/execute', async (req, res, next) => {
  try { success(res, await svc.trigger(req.params.id, req.body.context || {}), 'Triggered', 202); }
  catch (e) { next(e); }
});

// List executions for a workflow
router.get('/:id/executions', async (req, res, next) => {
  try {
    const { data, total } = await svc.listExecutions(req.params.id, req.query);
    paginated(res, data, total, req.query.page || 1, req.query.limit || 20);
  } catch (e) { next(e); }
});

// Publish (set status to active)
router.post('/:id/publish', async (req, res, next) => {
  try { success(res, await svc.update(req.params.id, { status: 'active' }), 'Published'); }
  catch (e) { next(e); }
});

module.exports = router;
