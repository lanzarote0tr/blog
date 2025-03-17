import express from 'express';
var router = express.Router();

import pool from '../utils/connectdb.js';

router.get('/', async function(req, res, next) {
  try {
    const [result] = await pool.query("SELECT * FROM Posts");
    res.render('blog', { posts: result });
  } catch(err) {
    next(err);
  }
});

export default router;
