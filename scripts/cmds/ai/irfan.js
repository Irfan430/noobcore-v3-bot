const a = require("axios");
const fs = require("fs");
const path = require("path");

const nix = "https://raw.githubusercontent.com/noobcore404/NC-STORE/refs/heads/main/NCApiUrl.json";

/* ================= API CACHE ================= */

let cachedApi = null;

async function getBaseApi() {
  if (cachedApi) return cachedApi;

  try {
    const { data } = await a.get(nix, { timeout: 10000 });
    cachedApi = data?.aryan;
    return cachedApi;
  } catch {
    return null;
  }
}

/* ================= GENDER ================= */

function genConvert(gender) {
  if (gender === 2 || gender === "MALE") return "Male";
  if (gender === 1 || gender === "FEMALE") return "Female";
  return "Unknown";
}

/* ================= MEMORY ================= */

function ensureUserFiles(uid) {
  const baseDir = path.join(process.cwd(), "irfan", uid);

  if (!fs.existsSync(baseDir))
    fs.mkdirSync(baseDir, { recursive: true });

  const dataPath = path.join(baseDir, "data.json");
  const pdataPath = path.join(baseDir, "pdata.json");

  if (!fs.existsSync(dataPath))
    fs.writeFileSync(dataPath, JSON.stringify({ messages: [] }, null, 2));

  if (!fs.existsSync(pdataPath))
    fs.writeFileSync(pdataPath, JSON.stringify({
      uid,
      gender: "Unknown",
      mode: "friend"
    }, null, 2));

  return { dataPath, pdataPath };
}

async function saveLastMessage(api, uid, message) {

  const { dataPath, pdataPath } = ensureUserFiles(uid);

  let pdata = JSON.parse(fs.readFileSync(pdataPath));

  if (pdata.gender === "Unknown") {
    try {
      const fb = (await api.getUserInfo(uid))[uid];
      pdata.gender = genConvert(fb?.gender);
      pdata.mode = pdata.gender === "Female" ? "girlfriend" : "friend";
      fs.writeFileSync(pdataPath, JSON.stringify(pdata, null, 2));
    } catch {}
  }

  let data = JSON.parse(fs.readFileSync(dataPath));

  data.messages.push(message);
  if (data.messages.length > 5)
    data.messages = data.messages.slice(-5);

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

  return { memory: data.messages.join("\n"), pdata };
}

/* ================= COMMAND ================= */

module.exports = {
  config: {
    name: "irfan",
    aliases: ["rafi"],
    version: "6.0.0",
    author: "Irfan GPT Mode",
    role: 0,
    usePrefix: true,
    category: "AI"
  },

  async ncStart({ api, event, args }) {

    const uid = event.senderID;
    const msg = args.join(" ");
    if (!msg)
      return api.sendMessage("Ki re? 😏", event.threadID);

    api.setMessageReaction("⚡", event.messageID, event.threadID, () => {}, true);

    const { memory, pdata } = await saveLastMessage(api, uid, msg);

    const baseApi = await getBaseApi();
    if (!baseApi)
      return api.sendMessage("API load hoilo na 😑", event.threadID);

    let personality = pdata.mode === "girlfriend"
      ? `
You are a real Bangla romantic boyfriend chatting casually.
Reply short, playful, emotional.
Use emoji naturally.
No AI tone.
`
      : `
You are a real Bangla funny close male friend.
Reply short, natural, casual.
No AI tone.
`;

    let prompt = `
${personality}

Previous chat:
${memory}

User: ${msg}
Reply:
`;

    if (prompt.length > 2000)
      prompt = prompt.slice(-2000);

    try {

      const { data } = await a.get(
        `${baseApi}/aryan/ask`,
        {
          params: { prompt },
          timeout: 30000
        }
      );

      if (!data?.answer)
        return api.sendMessage("Ektu lag korse 😅", event.threadID);

      let reply = data.answer
        .replace(/^IRFAN:\s*/i, "")
        .replace(/\*/g, "")
        .trim();

      if (reply.length > 250)
        reply = reply.slice(0, 250);

      api.sendMessage(reply, event.threadID, (err, info) => {
        if (!info) return;
        global.noobCore.ncReply.set(info.messageID, {
          commandName: "irfan",
          author: uid
        });
      }, event.messageID);

    } catch (err) {

      if (err.code === "ECONNABORTED")
        return api.sendMessage("Timeout 30s 😅 abar try kor", event.threadID);

      return api.sendMessage("Server busy 😑", event.threadID);
    }
  },

  async ncReply({ api, event, Reply }) {

    if (event.senderID !== Reply.author) return;
    if (!event.body) return;

    const uid = event.senderID;
    const msg = event.body;

    api.setMessageReaction("⚡", event.messageID, event.threadID, () => {}, true);

    const { memory, pdata } = await saveLastMessage(api, uid, msg);
    const baseApi = await getBaseApi();
    if (!baseApi) return;

    let personality = pdata.mode === "girlfriend"
      ? "Romantic playful Bangla boyfriend. Short reply."
      : "Funny casual Bangla male friend. Short reply.";

    let prompt = `
${personality}

Chat:
${memory}

User: ${msg}
Reply:
`;

    try {

      const { data } = await a.get(
        `${baseApi}/aryan/ask`,
        {
          params: { prompt },
          timeout: 30000
        }
      );

      if (!data?.answer) return;

      let reply = data.answer
        .replace(/^IRFAN:\s*/i, "")
        .replace(/\*/g, "")
        .trim();

      if (reply.length > 250)
        reply = reply.slice(0, 250);

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