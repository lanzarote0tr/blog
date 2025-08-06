import express from 'express';
import createError from 'http-errors';
import formatDate from '../utils/helper.js';
var router = express.Router();

import pool from '../utils/connectdb.js';

router.get('/', async function(req, res, next) {
  try {
    const [result] = await pool.query("SELECT * FROM Posts");
    if (result.length === 0) {
      return res.render('blog', { posts: [], message: 'No posts available.' });
    }
    var data = [];
    result.forEach(post => {
      data.push({
        PostID: post.PostID || "",
        Title: post.Title || "",
        Created_at: formatDate(post.Created_at) || "",
      });
    });
    res.render('blog', { posts: data });
  } catch(err) {
    next(err);
  }
});

router.get('/viewpost', async function(req, res, next) {
  const postId = req.query.postid;
  if (!postId) {
    return next(createError(400));
  }
  try {
    const [result] = await pool.query("SELECT * FROM Posts WHERE PostID = ?", [postId]);
    if (result.length === 0) {
      next(createError(404, 'Post not found'));
      return;
    }
    var data = {
      PostID: result[0].PostID || 0,
      Title: result[0].Title || "",
      Content: result[0].Content || "",
      Author_id: result[0].Author_id || 0,
      Updated_at: formatDate(result[0].Updated_at) || "",
    }
    res.render('viewpost', { post: data });
  } catch(err) {
    next(err);
  }
});

export default router;
