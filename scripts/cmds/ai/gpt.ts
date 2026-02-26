import axios from "axios";

const config = {
  name: "gpt",
  version: "1.0",
  author: "🤷",
  role: 0,
  shortDescription: "GPT chat",
  category: "ai"
};


async function askGPT(question: string): Promise<string> {
  const res = await axios.get(
    `https://zetbot-page.onrender.com/api/gptChat?q=${encodeURIComponent(
      question
    )}`
  );

  return (
    res.data.reply ||
    res.data.message ||
    res.data.result ||
    res.data.answer ||
    "No response."
  );
}


async function ncStart({
  message,
  args,
  event
}: {
  message: any;
  args: string[];
  event: any;
}) {
  const question = args.join("");

  if (!question) {
    return message.reply("Asks me questions.");
  }

  try {
    const reply = await askGPT(question);

    message.reply(reply, (_: any, info: any) => {
      global.noobCore.ncReply.set(info.messageID, {
        commandName: "gpt",
        author: event.senderID
      });
    });
  } catch {
    message.reply("API error.");
  }
}


async function ncReply({
  message,
  event,
  Reply
}: {
  message: any;
  event: any;
  Reply: { author: string };
}) {
  if (event.senderID !== Reply.author) return;

  try {
    const reply = await askGPT(event.body);

    message.reply(reply, (_: any, info: any) => {
      global.noobCore.ncReply.set(info.messageID, {
        commandName: "gpt",
        author: event.senderID
      });
    });
  } catch {
    message.reply("API error.");
  }
}

export default {
  config,
  ncStart,
  ncReply
};