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
import fs from 'fs';

// __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

var app = express();

// Security
import helmet from "helmet";
app.use(helmet());

app.set('trust proxy', 2); // Trust first two proxies: Nginx and Cloudflare

const limiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 30, // limit each IP to 30 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

const BLOCKED_IPS = new Set(
  fs.readFileSync(path.join(__dirname, 'ipban.txt'), 'utf8')
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip && !ip.startsWith('#')) // skip empty or commented lines
);

app.use(async function (req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  if (BLOCKED_IPS.has(ip)) {
    console.log(`Blocked IP: ${ip}`);
    next(createError(403, "Your IP address has been blocked."));
    return;
  }
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

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));


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
  switch (err.status) {
    case 403:
      res.locals.title = "Forbidden";
      res.locals.message = err.message || "You do not have permission to access this resource.";
      break;
    case 404:
      res.locals.title = "Page Not Found";
      break;
    case 500:
    default:
      res.locals.title = "Internal Server Error";
  }

  res.locals.message = err.message || "An error occurred";
  res.locals.error = req.app.get("env") === "development" ? err : {status: err.status || 500, message: "Please contact the administrator to report this issue."};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
