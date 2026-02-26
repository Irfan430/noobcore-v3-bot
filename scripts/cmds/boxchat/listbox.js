const sendPage = async (
  api,
  event,
  groups,
  page,
  perPage,
  author
) => {

  const totalPages = Math.ceil(groups.length / perPage);

  if (page < 1) page = 1;
  if (page > totalPages) page = totalPages;

  const start = (page - 1) * perPage;

  const list = groups.slice(start, start + perPage);

  const msg = list.map((g, i) => {

    let name =
      g.name ||
      g.threadName ||
      "Unnamed Group";

    if (name.length > 35)
      name = name.slice(0, 35) + "...";

    return `${start + i + 1}. ${name}
   └─ 🆔 ${g.threadID}`;

  }).join("\n\n");

  const body =
`📦 GROUP CHATS LIST
━━━━━━━━━━━━━━━━━━
${msg}
━━━━━━━━━━━━━━━━━━

📄 Page: ${page}/${totalPages}

📌 Reply:
• next
• prev
• leave <number>`;

  const info = await api.sendMessage(
    body,
    event.threadID
  );

  global.noobCore.ncReply.set(info.messageID, {
    commandName: "listbox",
    author,
    groups,
    page,
    perPage,
    messageID: info.messageID
  });
};

module.exports = {
  config: {
    name: "listbox",
    aliases: ["listgroups"],
    version: "4.0",
    author: "NC-FAHAD",
    role: 3,
    category: "box chat"
  },

  ncStart: async function ({ api, event }) {

    const list = await api.getThreadList(
      100,
      null,
      ["INBOX"]
    );

    const groups = list.filter(i => i.isGroup);

    if (!groups.length)
      return api.sendMessage(
        "📭 No groups found.",
        event.threadID
      );

    await sendPage(
      api,
      event,
      groups,
      1,
      10,
      event.senderID
    );
  },

  ncReply: async function ({ api, event, Reply }) {

    if (
      !event.messageReply ||
      event.messageReply.messageID !== Reply.messageID
    ) return;

    if (event.senderID !== Reply.author) return;

    const text = event.body.trim().toLowerCase();

    if (text === "next") {
      return sendPage(
        api,
        event,
        Reply.groups,
        Reply.page + 1,
        Reply.perPage,
        Reply.author
      );
    }

    if (text === "prev") {
      return sendPage(
        api,
        event,
        Reply.groups,
        Reply.page - 1,
        Reply.perPage,
        Reply.author
      );
    }

    if (text.startsWith("leave")) {

      const num = parseInt(
        text.split(" ")[1]
      );

      if (isNaN(num)) return;

      const index = num - 1;

      if (
        index < 0 ||
        index >= Reply.groups.length
      )
        return api.sendMessage(
          "❌ Invalid number",
          event.threadID
        );

      const group =
        Reply.groups[index];

      await api.removeUserFromGroup(
        api.getCurrentUserID(),
        group.threadID
      );

      return api.sendMessage(
        `✅ Left:\n${group.threadName || group.name}`,
        event.threadID
      );
    }
  }
};