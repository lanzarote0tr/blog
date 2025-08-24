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

router.get('/createpost', async function(req, res, next) {
  res.render('createpost');
})

router.post('/createpost', async function(req, res, next) {
  const { title, content } = req.body;
  if (!title || !content) {
    next(createError(400, "Title and content are required."));
    return;
  }
  try {
    const [result] = await pool.query("INSERT INTO Posts (Title, Content, Author_id) VALUES (?, ?, 1)", [title, content]);
    res.status(201).json({ message: 'Post created successfully', postId: result.insertId });
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
      Created_at: formatDate(result[0].Created_at) || "",
    }
    res.render('viewpost', { post: data });
  } catch(err) {
    next(err);
  }
});

router.delete('/', async function(req, res, next) {
  const postId = req.query.id;
  if (!postId) {
    next(createError(400))
  }
  try {
    const [result] = await pool.query("DELETE FROM Posts WHERE PostID = ?", [postId]);
    if (result.affectedRows === 0) {
      return res.status(404).render('error', { message: 'Post not found', status: 404 });
    }
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch(err) {
    next(err);
  }
});

export default router;
