import express from 'express';
import helper from '../utils/helper.js';
var router = express.Router();

import pool from '../utils/connectdb.js';

router.get('/', async function(req, res, next) {
  try {
    const [result] = await pool.query("SELECT * FROM Posts");
    if (result.length === 0) {
      return res.render('blog', { posts: [], message: 'No posts available.' });
    }
    data = [];
    result.forEach(post => {
      data.push({
        PostID: post.PostID || "",
        Title: post.Title || "",
        Created_at: helper.formatDate(post.Created_at) || "",
      });
    });
    res.render('blog', { posts: data });
  } catch(err) {
    next(err);
  }
});

router.get('/viewpost', async function(req, res, next) {
  const postId = req.params.id;
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
