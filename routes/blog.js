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

router.get('/viewpost/:postid', async function(req, res, next) {
  const postId = req.params.postid;
  try {
    const [result] = await pool.query("SELECT * FROM Posts WHERE PostID = ?", [postId]);
    if (result.length === 0) {
      return res.status(404).render('error', { message: 'Post not found', status: 404 });
    }
    res.render('viewpost', { post: result[0] });
  } catch(err) {
    next(err);
  }
});

export default router;
