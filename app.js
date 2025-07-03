import createError from "http-errors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cookieParser from "cookie-parser";
// import logger from "morgan";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import indexRouter from "./routes/index.js";
import blogRouter from "./routes/blog.js";
import pool from './utils/connectdb.js';

// __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

var app = express();

app.set('trust proxy', 1); // Trust first proxy: Cloudflare

const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // limit each IP to 30 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// logger.token('ip', (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress);
// app.use(logger(':ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
//   stream: process.stdout
// }));

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(async function (req, res, next) {
  res.on("finish", async () => {
    // Log to the databse like morgan
    try {
      await pool.query("INSERT INTO RequestLogs (timestamp, ip, method, url, userAgent, referrer, status, contentLength) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [new Date(), req.ip, req.method, req.originalUrl, req.get('user-agent'), req.get('referer') || null , res.statusCode, res.get('content-length') || 0]);
    } catch (err) {
      console.error("Error logging request:", err);
    }
  });
  next();
});

// Routing
app.use("/", indexRouter);
app.use("/blog", blogRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message || "An error occurred";
  res.locals.error = req.app.get("env") === "development" ? err : {status: err.status || 500, message: "Please contact the administrator to report this issue."};
  switch (err.status) {
    case 404:
      res.locals.title = "Page Not Found";
      break;
    case 500:
    default:
      res.locals.title = "Internal Server Error";
  }

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
