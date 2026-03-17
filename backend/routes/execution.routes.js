const router = require('express').Router();
const svc    = require('../services/execution.service');
const { success, paginated } = require('../utils/apiResponse');

router.get('/', async (req, res, next) => {
  try {
    const { data, total } = await svc.listAll(req.query);
    paginated(res, data, total, req.query.page || 1, req.query.limit || 50);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { success(res, await svc.get(req.params.id)); }
  catch (e) { next(e); }
});

router.post('/:id/cancel', async (req, res, next) => {
  try { success(res, await svc.cancel(req.params.id, req.body.reason), 'Cancelled'); }
  catch (e) { next(e); }
});

router.post('/:id/retry', async (req, res, next) => {
  try { success(res, await svc.retry(req.params.id), 'Retry queued', 202); }
  catch (e) { next(e); }
});

router.get('/:id/steps', async (req, res, next) => {
  try { success(res, await svc.stepLogs(req.params.id)); }
  catch (e) { next(e); }
});

module.exports = router;
