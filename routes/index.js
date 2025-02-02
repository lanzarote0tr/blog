var express = require('express');
var router = express.Router();

const pool = require('../utils/connectdb');

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    const [result] = await pool.query("SELECT * FROM posts");
    res.render('index', { title: 'Express', posts: result });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
