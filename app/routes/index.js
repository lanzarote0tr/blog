import express from 'express';
var router = express.Router();

router.get('/', async function(req, res, next) {
  res.render('index');
});

export default router;
