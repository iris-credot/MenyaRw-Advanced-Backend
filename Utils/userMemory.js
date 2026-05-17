// Utils/userMemory.js
// Unlike your previous version which stored memory in RAM (lost on restart),
// this version stores memory inside the ChatSession document in MongoDB.
// No separate memory store needed — the session IS the memory.

const INTEREST_KEYWORDS = {
  royal:     ['royal', 'king', 'palace', 'mwami', 'throne', 'kingdom'],
  genocide:  ['genocide', 'memorial', 'murambi', 'gisozi', '1994'],
  nature:    ['nature', 'forest', 'park', 'mountain', 'lake', 'wildlife', 'nyungwe', 'akagera'],
  culture:   ['culture', 'dance', 'ceremony', 'tradition', 'intore', 'craft'],
  colonial:  ['colonial', 'german', 'belgian', 'missionary', 'kandt'],
  history:   ['history', 'historical', 'ancient', 'heritage', 'past'],
};

// ─── Extract interests from a message ────────────────────────────────────────
const extractInterests = (message) => {
  const lower = message.toLowerCase();
  const found = [];

  for (const [category, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(category);
    }
  }

  return found;
};

// ─── Build memory summary from session messages ───────────────────────────────
// Called before each AI request to summarize what the user has shown interest in
const buildMemorySummary = (messages) => {
  if (!messages || messages.length === 0) return null;

  const userMessages = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content);

  const allInterests = new Set();
  userMessages.forEach((msg) => {
    extractInterests(msg).forEach((i) => allInterests.add(i));
  });

  const recentTopics = userMessages.slice(-3);

  return {
    interests: [...allInterests],
    recentTopics,
    totalMessages: messages.length,
  };
};

module.exports = { extractInterests, buildMemorySummary };