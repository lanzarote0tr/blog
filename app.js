import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import { Client, Intents } from 'discord.js';
import { verifyKeyMiddleware } from 'discord-interactions';

import onMessageCreate from './utils/discordapp.js';

import indexRouter from './routes/index.js';
import interactionsRouter from './routes/interactions.js';
import blogRouter from './routes/blog.js';

// __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

var app = express();

// discord setup
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
global.chatDefault = [{
  "role":"developer",
  "content": [{ "type":"text", "text":"너는 \"한국디지털미디어고등학교\"에 다니는 해킹방어과 1학년 학생들을 위한 어시스턴트이다." }]
}];
global.chatHistory = chatDefault;
discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});
discordClient.on("messageCreate", onMessageCreate);
discordClient.login(process.env.DISCORD_TOKEN);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routing
app.use('/', indexRouter);
app.use('/interactions', verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY), interactionsRouter);
app.use('/blog', blogRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  switch(err.status) {
    case 404:
      res.locals.title = 'Page Not Found';
      break;
    case 500:
    default:
      res.locals.title = 'Internal Server Error';
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
