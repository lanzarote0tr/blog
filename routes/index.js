import express from 'express';
var router = express.Router();

import pool from '../utils/connectdb.js';

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const [result] = await pool.query("SELECT * FROM posts");
    res.render('index', { title: 'Express', posts: result });
  } catch(err) {
    next(err);
  }
});

export default router;
