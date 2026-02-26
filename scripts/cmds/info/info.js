module.exports = {
  config: {
    name: "info",
    version: "2.0",
    author: "💋 𝑰𝑹𝑭𝑨𝑵 𝑫𝒆𝒗",
    countDown: 5,
    role: 0,
    premium: false,
    usePrefix: false,
    shortDescription: {
      en: "Show IRFAN bot information"
    },
    description: {
      en: "Display detailed information about IRFAN 💋"
    },
    category: "utility",
    guide: {
      en: "{prefix}info"
    }
  },

  langs: {
    en: {
      infoMessage:
`╔═══════════════════════╗
   💋 𝑰𝑹𝑭𝑨𝑵 𝑩𝑶𝑻 𝑰𝑵𝑭𝑶
╚═══════════════════════╝

🤖 Bot Name: 𝑰𝑹𝑭𝑨𝑵 💋
⚡ Version: 1.0 Flirty Edition
👑 Creator: IRFAN
🌐 Platform: Facebook Messenger
🧠 Personality: Playful • Romantic • Possessive
🔄 Reply System: Enabled

━━━━━━━━━━━━━━━━━━

Reply with:

1️⃣  ➤ Show Prefix  
2️⃣  ➤ Show Admin List  
3️⃣  ➤ Show Creator ID  

React ❤️ to see how long IRFAN stayed for you 😏
`
    }
  },

  ncStart: async function ({ api, event }) {
    const message = this.langs.en.infoMessage;

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
        `💋 Baby, amar prefix holo: ${ncsetting.prefix}`,
        threadID,
        messageID
      );
    }

    if (body === "2") {
      return api.sendMessage(
        `👮 Amar trusted admins:\n${ncsetting.adminBot.join("\n")}`,
        threadID,
        messageID
      );
    }

    if (body === "3") {
      return api.sendMessage(
        `👑 Amar Creator ID:\n${ncsetting.creator.join("\n")}`,
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
      `⏳ IRFAN tomar jonno online ache:\n${hours}h ${minutes}m ${seconds}s 💖`,
      event.threadID,
      event.messageID
    );
  }
};