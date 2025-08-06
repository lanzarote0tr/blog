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
  const postId = req.query["id"];
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
