module.exports = {
  config: {
    name: "info",
    version: "2.1",
    author: "IRFAN System",
    countDown: 5,
    role: 0,
    premium: false,
    usePrefix: true,
    shortDescription: {
      en: "Show bot information"
    },
    description: {
      en: "Display dynamic bot information from config"
    },
    category: "utility",
    guide: {
      en: "{prefix}info"
    }
  },

  ncStart: async function ({ api, event }) {

    const ncsetting = global.noobCore.ncsetting;

    const botName = ncsetting.nickNameBot || "Unknown";
    const prefix = ncsetting.prefix || "!";
    const adminList = ncsetting.adminBot?.join("\n") || "None";
    const creatorList = ncsetting.creator?.join("\n") || "None";
    const port = ncsetting.port || "N/A";
    const language = ncsetting.language || "N/A";

    const message = `
╔═══════════════════════╗
   🤖 ${botName} INFO
╚═══════════════════════╝

⚡ Prefix: ${prefix}
🌐 Port: ${port}
🗣 Language: ${language}
👮 Admins:
${adminList}

👑 Creator:
${creatorList}

━━━━━━━━━━━━━━━━━━

Reply with:

1️⃣  ➤ Show Prefix  
2️⃣  ➤ Show Admin List  
3️⃣  ➤ Show Creator ID  

React ❤️ to see uptime
`;

    await api.sendMessage(message, event.threadID, (error, info) => {
      if (error) return console.log(error);

      global.noobCore.ncReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });

      global.noobCore.ncReaction.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID
      });

    }, event.messageID);
  },

  ncReply: async function ({ api, event }) {

    const { body, threadID, messageID } = event;
    const ncsetting = global.noobCore.ncsetting;

    if (body === "1") {
      return api.sendMessage(
        `🔹 Current Prefix: ${ncsetting.prefix}`,
        threadID,
        messageID
      );
    }

    if (body === "2") {
      return api.sendMessage(
        `👮 Admin List:\n${ncsetting.adminBot.join("\n")}`,
        threadID,
        messageID
      );
    }

    if (body === "3") {
      return api.sendMessage(
        `👑 Creator ID:\n${ncsetting.creator.join("\n")}`,
        threadID,
        messageID
      );
    }
  },

  ncReaction: async function ({ api, event }) {

    if (event.reaction !== "❤") return;

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    return api.sendMessage(
      `⏳ Bot Uptime:\n${hours}h ${minutes}m ${seconds}s`,
      event.threadID,
      event.messageID
    );
  }
};