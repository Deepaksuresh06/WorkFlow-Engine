const router = require('express').Router();
const svc    = require('../services/rule.service');
const { success } = require('../utils/apiResponse');

router.get('/',     async (req, res, next) => {
  try { success(res, await svc.list()); } catch (e) { next(e); }
});
router.post('/',    async (req, res, next) => {
  try { success(res, await svc.create(req.body), 'Rule created', 201); } catch (e) { next(e); }
});
router.put('/:id',  async (req, res, next) => {
  try { success(res, await svc.update(req.params.id, req.body), 'Updated'); } catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try { await svc.remove(req.params.id); success(res, null, 'Deleted'); } catch (e) { next(e); }
});

module.exports = router;
