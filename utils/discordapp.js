import axios from "axios";

async function callChatGPT(message_contents) {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = "https://api.openai.com/v1/chat/completions";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const data = {
    model: "gpt-4o-mini",
    messages: message_contents
  };

  try {
    const response = await axios.post(url, data, {headers} );
    // console.log(response);
    const result = response.data.choices[0].message.content;
    return result;
  } catch (error) {
    console.error(
      "Error calling ChatGPT API:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function getFullTextFromReadableStream(readableStream) {
  const reader = readableStream.getReader();
  let fullText = '';
  let done = false;

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (value) {
      fullText += new TextDecoder().decode(value); // Decode the chunk
    }
    done = streamDone;
  }

  return fullText;
}

async function DiscordRequest(endpoint, options) {
  // append endpoint to root API URL
  const url = 'https://discord.com/api/v10/' + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  // Use fetch to make requests
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (https://github.com/ethanwoncho/blog, 1.0.0)',
    },
    ...options
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

export async function onMessageCreate(message) { // Listen for the "messageCreate" event
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
}
