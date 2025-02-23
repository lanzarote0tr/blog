var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const { Client, Intents } = require('discord.js');
const { InteractionType, InteractionResponseType, verifyKeyMiddleware } = require('discord-interactions');

var { DiscordRequest, callChatGPT } = require('./utils/utils');

var indexRouter = require('./routes/index');
var interactionsRouter = require('./routes/interactions');

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

// discord routing
app.use('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), interactionsRouter);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


discordClient.on('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}!`);
});

discordClient.on("messageCreate", async function (message) { // Listen for the "messageCreate" event
  // Check if message is from the bot itself to avoid infinite loops
  if (message.author.bot || message.channelId != 1331901049942048819) return;
  console.log(`got a message!: ${message.content} `);
  global.chatHistory.push({
    "role":"user",
    "content":[{ "type":"text", "text":message.content }]
  });
  const assistant_say = await callChatGPT(global.chatHistory);
  global.chatHistory.push({
    "role":"assistant",
    "content":[{ "type":"text", "text":assistant_say }]
  });
  // SEND IT!!!
  const endpoint = `channels/1331901049942048819/messages`;
  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    const safeAssistantSay = String(assistant_say);
    const rst = await DiscordRequest(endpoint, { 
      method: 'POST', 
      body: {
        content: safeAssistantSay, // This should be a string, not an object
        tts: false // Add this directly to the body
      }
    });
    console.log(rst);
  } catch (err) {
    console.error(err);
  }
});

discordClient.login(process.env.DISCORD_TOKEN);

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
    // default:
      res.locals.title = 'Internal Server Error';
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
