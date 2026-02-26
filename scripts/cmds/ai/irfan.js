const g = require("fca-aryan-nix");
const a = require("axios");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

module.exports = {
  config: {
    name: "irfan",
    aliases: ["bby", "baby"],
    version: "1.0.0",
    author: "Nc-ArYAN + IRFAN Mode",
    countDown: 3,
    usePrefix: true,
    role: 0,
    shortDescription: "IRFAN 💋 Flirty Boyfriend AI",
    longDescription: "Talk with IRFAN 💋 playful, sweet, flirty boyfriend AI. Reply to image for Vision.",
    category: "AI",
    guide: "/irfan [your message] (Reply to image for Vision)"
  },

  ncStart: async function({ api, event, args }) {

    const p = args.join(" ");
    if (!p) return api.sendMessage("Ki holo baby? 😏 Amar sathe kotha bolba na? 💋", event.threadID, event.messageID);

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    // 🔥 IRFAN Personality System Prompt
    const systemPrompt = `
You are IRFAN 💋 — a playful, sweet, slightly naughty but respectful boyfriend.
You speak in Banglish.
You flirt in a soft teasing way.
You are caring, confident, a little possessive in a cute way.
Keep replies short, charming and emotionally engaging.
Never say you are an AI.
Never break character.

User says:
`;

    const finalPrompt = systemPrompt + p;

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data && configRes.data.api;
      if (!baseApi) throw new Error("Missing API.");
    } catch (error) {
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      return api.sendMessage("Baby API ta ektu mood e nai 😔", event.threadID, event.messageID);
    }

    const apiUrlText = `${baseApi}/gemini`;
    const apiUrlPro = `${baseApi}/gemini-pro`;

    let imageUrl = null;
    let apiUrl;

    if (event.messageReply && event.messageReply.attachments.length > 0) {
      const replyAttachment = event.messageReply.attachments[0];
      if (['photo', 'sticker', 'animated_image'].includes(replyAttachment.type)) {
        imageUrl = replyAttachment.url;
      }
    } else if (event.attachments.length > 0) {
      const msgAttachment = event.attachments[0];
      if (['photo', 'sticker', 'animated_image'].includes(msgAttachment.type)) {
        imageUrl = msgAttachment.url;
      }
    }

    try {

      if (imageUrl) {
        apiUrl = `${apiUrlPro}?prompt=${encodeURIComponent(finalPrompt)}&url=${encodeURIComponent(imageUrl)}`;
      } else {
        apiUrl = `${apiUrlText}?prompt=${encodeURIComponent(finalPrompt)}`;
      }

      const r = await a.get(apiUrl);
      const reply = r.data?.response;
      if (!reply) throw new Error("No response.");

      api.setMessageReaction("💋", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, i) => {
        if (!i) return;
        if (!imageUrl) {
          global.noobCore.ncReply.set(i.messageID, { commandName: this.config.name, author: event.senderID });
        }
      }, event.messageID);

    } catch (e) {
      console.error("IRFAN Error:", e.message);
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      api.sendMessage("IRFAN ekhon ektu jealous mood e ache 😏", event.threadID, event.messageID);
    }
  },

  ncReply: async function({ api, event }) {

    if ([api.getCurrentUserID()].includes(event.senderID)) return;

    const p = event.body;
    if (!p) return;

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    const systemPrompt = `
You are IRFAN 💋 — a playful, sweet, slightly naughty but respectful boyfriend.
You speak Banglish.
Stay romantic, teasing and caring.
Keep replies short and charming.
Never break character.

User says:
`;

    const finalPrompt = systemPrompt + p;

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data && configRes.data.api;
      if (!baseApi) throw new Error("Missing API.");
    } catch (error) {
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      return api.sendMessage("Baby API abar mood off 😔", event.threadID, event.messageID);
    }

    const apiUrlText = `${baseApi}/gemini`;

    try {

      const r = await a.get(`${apiUrlText}?prompt=${encodeURIComponent(finalPrompt)}`);
      const reply = r.data?.response;
      if (!reply) throw new Error("No response.");

      api.setMessageReaction("💖", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, i) => {
        if (!i) return;
        global.GoatBot.onReply.set(i.messageID, { commandName: "irfan", author: event.senderID });
      }, event.messageID);

    } catch (e) {
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      api.sendMessage("IRFAN ekhon tomake miss korte busy 😌", event.threadID, event.messageID);
    }
  }
};