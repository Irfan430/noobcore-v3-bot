const g = require("fca-aryan-nix");
const a = require("axios");
const fs = require("fs");
const path = require("path");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

/* ================= MEMORY SYSTEM ================= */

function ensureUserFiles(uid) {
  const baseDir = path.join(process.cwd(), "irfan", uid);

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const dataPath = path.join(baseDir, "data.js");
  const pdataPath = path.join(baseDir, "pdata.js");

  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ messages: [] }, null, 2));
  }

  if (!fs.existsSync(pdataPath)) {
    fs.writeFileSync(pdataPath, JSON.stringify({
      uid: uid,
      name: "",
      createdAt: Date.now()
    }, null, 2));
  }

  return { dataPath, pdataPath };
}

function saveLastMessage(uid, name, message) {

  const { dataPath, pdataPath } = ensureUserFiles(uid);

  let data = JSON.parse(fs.readFileSync(dataPath));
  data.messages.push({
    text: message,
    time: Date.now()
  });

  if (data.messages.length > 7) {
    data.messages = data.messages.slice(-7);
  }

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  let pdata = JSON.parse(fs.readFileSync(pdataPath));
  pdata.name = name;
  pdata.lastActive = Date.now();

  fs.writeFileSync(pdataPath, JSON.stringify(pdata, null, 2));

  return data.messages.map(m => m.text).join("\n");
}

/* ================================================= */

module.exports = {
  config: {
    name: "irfan",
    aliases: ["bby", "baby"],
    version: "3.0.0",
    author: "IRFAN Stable Memory",
    countDown: 3,
    usePrefix: true,
    role: 0,
    category: "AI"
  },

  ncStart: async function({ api, event, args }) {

    const uid = event.senderID;
    const message = args.join(" ");
    if (!message) return api.sendMessage("Ki holo baby? 😏", event.threadID, event.messageID);

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    const memoryContext = saveLastMessage(uid, uid, message);

    const systemPrompt = `
You are IRFAN 💋 playful romantic boyfriend.
Use memory context if relevant.

Last 7 messages:
${memoryContext}

User says:
`;

    const finalPrompt = systemPrompt + message;

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data?.api;
      if (!baseApi) throw new Error("API missing");
    } catch {
      return api.sendMessage("API mood off 😔", event.threadID, event.messageID);
    }

    try {

      const r = await a.get(`${baseApi}/gemini?prompt=${encodeURIComponent(finalPrompt)}`);
      const reply = r.data?.response;
      if (!reply) throw new Error("No response");

      api.setMessageReaction("💋", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, info) => {
        if (!info) return;

        global.noobCore.ncReply.set(info.messageID, {
          commandName: "irfan",
          author: uid
        });
      }, event.messageID);

    } catch (e) {
      api.sendMessage("IRFAN jealous mood e 😏", event.threadID, event.messageID);
    }
  },

  ncReply: async function({ api, event }) {

    if (event.senderID == api.getCurrentUserID()) return;
    if (!event.body) return;

    const uid = event.senderID;
    const message = event.body;

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    const memoryContext = saveLastMessage(uid, uid, message);

    const systemPrompt = `
You are IRFAN 💋 romantic boyfriend.
Use previous context naturally.

Last 7 messages:
${memoryContext}

User says:
`;

    const finalPrompt = systemPrompt + message;

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data?.api;
    } catch {
      return;
    }

    try {

      const r = await a.get(`${baseApi}/gemini?prompt=${encodeURIComponent(finalPrompt)}`);
      const reply = r.data?.response;

      api.setMessageReaction("💖", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, info) => {
        if (!info) return;

        global.noobCore.ncReply.set(info.messageID, {
          commandName: "irfan",
          author: uid
        });
      }, event.messageID);

    } catch {}
  }
};