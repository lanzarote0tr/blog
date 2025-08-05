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

// __dirname
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

async function logger(req, res) {
  try {
    await pool.query("INSERT INTO RequestLogs (timestamp, ip, method, url, userAgent, referrer, status, contentLength) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [new Date(), req.ip, req.method, req.originalUrl, req.get('user-agent'), req.get('referer') || null , res.statusCode, res.get('content-length') || 0]);
  } catch (err) {
    console.error("Error logging request:", err);
  }
}

app.use(async function (req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  if (BLOCKED_IPS.has(ip)) {
    console.log(`Blocked IP: ${ip}`);
    res.status(403);
    await logger(req, res);
    next(createError(403, "Your IP address has been blocked."));
    return;
  }
  res.on("finish", () => {
    logger(req, res);
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
  parsed_error = {
    name: "",
    message: "",
    stack: "",
    status: err.status || 500,
  };
  console.error("Error:", err);
  if (req.app.get("env") === "development") {
    parsed_error.name = err.name || "Error";
    parsed_error.message = err.message || "An unexpected error occurred.";
    parsed_error.stack = err.stack || "";
  } else {
    if (parsed_error.status == 403) {
      parsed_error.name = "Forbidden";
      parsed_error.message = "You do not have permission to access this resource.";
    } else if (parsed_error.status < 500) {
      parsed_error.name = err.name || "Client Error";
      parsed_error.message = err.message || "An error occurred. Please try again later.";
    } else {
      parsed_error.name = "Internal Server Error";
      parsed_error.message = "Please contact the site administrator.";
    }
  }

  // render the error page
  res.status(parsed_error.status);
  res.render("error", { error: parsed_error });
});

export default app;
