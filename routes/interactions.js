import express from 'express';
var router = express.Router();
import { InteractionType, InteractionResponseType } from 'discord-interactions';

router.post('/', async function(req, res, next) {
  console.log(global.chatHistory);
  console.log(global.chatDefault);
  // Interaction type and data
  const { type, data } = req.body;
  // Handle verification requests
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    if (name === "clearmessages") {
      const endpoint = "channels/1331901049942048819/messages";
      try {
        global.chatHistory = global.chatDefault;
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "*Dies*"
          }
        });
        
      } catch (err) {
        console.error(err);
      }
    }
    console.error("unknown command: ${name}");
    return res.status(400).json({ error: "unknown command" });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

export default router;
