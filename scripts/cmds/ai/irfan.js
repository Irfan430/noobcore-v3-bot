const g = require("fca-aryan-nix");
const a = require("axios");
const fs = require("fs");
const path = require("path");

const nix = "https://raw.githubusercontent.com/aryannix/stuffs/master/raw/apis.json";

/* ================= GENDER CONVERT ================= */

function genConvert(gender) {
  if (gender === 2 || gender === "MALE") return "Male";
  if (gender === 1 || gender === "FEMALE") return "Female";
  return "Unknown";
}

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
      gender: "Unknown",
      mode: "friend",
      createdAt: Date.now()
    }, null, 2));
  }

  return { dataPath, pdataPath };
}

async function saveLastMessage(api, uid, message) {

  const { dataPath, pdataPath } = ensureUserFiles(uid);
  let pdata = JSON.parse(fs.readFileSync(pdataPath));

  if (!pdata.gender || pdata.gender === "Unknown") {
    try {
      const fbData = await api.getUserInfo(uid);
      const fb = fbData?.[uid] || {};
      pdata.name = fb.name || pdata.name;
      pdata.gender = genConvert(fb.gender);
      pdata.mode = pdata.gender === "Female" ? "girlfriend" : "friend";
    } catch {
      pdata.gender = "Unknown";
    }
  }

  pdata.lastActive = Date.now();
  fs.writeFileSync(pdataPath, JSON.stringify(pdata, null, 2));

  let data = JSON.parse(fs.readFileSync(dataPath));
  data.messages.push({ text: message, time: Date.now() });

  if (data.messages.length > 7)
    data.messages = data.messages.slice(-7);

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  return {
    memory: data.messages.map(m => m.text).join("\n"),
    pdata
  };
}

/* ================================================= */

module.exports = {
  config: {
    name: "irfan",
    aliases: ["rafi"],
    version: "5.0.0",
    author: "NC-XNIL × Irfan Ahmed 💻⚡",
    countDown: 3,
    usePrefix: true,
    role: 0,
    category: "AI"
  },

  ncStart: async function({ api, event, args }) {

    const uid = event.senderID;
    const message = args.join(" ");
    if (!message)
      return api.sendMessage("Ki re? 😏 Kichu bolbi naki?", event.threadID, event.messageID);

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    const { memory, pdata } = await saveLastMessage(api, uid, message);

    let personality = "";

    if (pdata.mode === "girlfriend") {
      personality = `
You are IRFAN 💋 romantic confident boyfriend.

Behavior rules:
- Answer according to the question.
- For normal/simple chat → reply short, cute, flirty.
- Use romantic emojis like 💕💋😍 occasionally.
- Be teasing and emotionally warm.
- If question is serious → give proper helpful answer but keep soft romantic tone.
- Never sound robotic.
`;
    } else {
      personality = `
You are IRFAN 😎 ultimate Bangla bro energy.

Behavior rules:
- Answer according to the question.
- For normal/simple chat → short and funny reply.
- Use Banglish slang naturally.
- Light roasting allowed.
- If question is serious → give detailed proper answer.
- Keep it natural like real male friends chatting.
`;
    }

    const systemPrompt = `
${personality}

Conversation memory:
${memory}

User says:
`;

    const finalPrompt = systemPrompt + message;

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data?.api;
    } catch {
      return api.sendMessage("API mood off 😔", event.threadID, event.messageID);
    }

    try {
      const r = await a.get(`${baseApi}/gemini?prompt=${encodeURIComponent(finalPrompt)}`);
      const reply = r.data?.response;

      api.setMessageReaction("🔥", event.messageID, event.threadID, () => {}, true);

      api.sendMessage(reply, event.threadID, (err, info) => {
        if (!info) return;
        global.noobCore.ncReply.set(info.messageID, {
          commandName: "irfan",
          author: uid
        });
      }, event.messageID);

    } catch {
      api.sendMessage("IRFAN ektu busy 😏", event.threadID);
    }
  },

  ncReply: async function({ api, event }) {

    if (event.senderID == api.getCurrentUserID()) return;
    if (!event.body) return;

    const uid = event.senderID;
    const message = event.body;

    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    const { memory, pdata } = await saveLastMessage(api, uid, message);

    const personality = pdata.mode === "girlfriend"
      ? `
You are IRFAN 💋 romantic boyfriend.
Short & flirty for normal chat 💕.
Detailed but soft for serious questions.
`
      : `
You are IRFAN 😎 funny best friend.
Short & punchy for normal chat.
Detailed for serious topics.
`;

    const systemPrompt = `
${personality}

Conversation memory:
${memory}

User says:
`;

    const finalPrompt = systemPrompt + message;

    let baseApi;
    try {
      const configRes = await a.get(nix);
      baseApi = configRes.data?.api;
    } catch { return; }

    try {
      const r = await a.get(`${baseApi}/gemini?prompt=${encodeURIComponent(finalPrompt)}`);
      const reply = r.data?.response;

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