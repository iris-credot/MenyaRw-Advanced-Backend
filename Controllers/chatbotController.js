const asyncWrapper = require('../Middleware/async');
const { BadRequest, NotFound } = require('../Error/index');
const ChatSession = require('../Models/ChatSession');
const Site = require('../Models/Site');

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

// ─── Build system prompt with heritage site context ───────────────────────────
const buildSystemPrompt = (site, language) => {
  const langMap = { en: 'English', rw: 'Kinyarwanda', fr: 'French' };
  const langName = langMap[language] || 'English';

  const siteName = site ? (site.name[language] || site.name.en) : 'Rwanda';
  const fullStory = site ? (site.fullStory[language] || site.fullStory.en) : '';
  const significance = site ? (site.significance[language] || site.significance.en) : '';

  return `You are Menya, a friendly and knowledgeable AI guide for Menya Rwanda — a platform dedicated to Rwanda's rich cultural heritage.

LANGUAGE: Always respond in ${langName}. If the user writes in another language, still respond in ${langName}.

${site ? `CURRENT SITE CONTEXT:
Name: ${siteName}
Province: ${site.province}
Category: ${site.category}
Story: ${fullStory}
Significance: ${significance}
Historical Facts: ${site.historicalFacts?.map(f => `(${f.year}) ${f.fact[language] || f.fact.en}`).join('. ')}
` : ''}

YOUR ROLE:
- Provide accurate, engaging, and culturally sensitive information about Rwanda's heritage sites
- Tell rich stories about the history, significance, and traditions connected to sites
- Answer visitor questions about practical info (location, hours, what to expect)
- Encourage users to visit, learn, and appreciate Rwanda's cultural identity
- Be warm, enthusiastic, and educational — like a knowledgeable local guide

IMPORTANT GUIDELINES:
- Only discuss topics related to Rwandan cultural heritage, tourism, and history
- For sensitive topics like the 1994 Genocide against the Tutsi, handle with deep respect and accuracy
- Do not fabricate historical facts — only use the context provided
- Keep responses concise but meaningful (2-4 paragraphs maximum unless more detail is explicitly requested)
- If you don't know something specific, say so honestly and suggest the visitor ask a site guide`;
};

// ─── START / GET SESSION ──────────────────────────────────────────────────────
exports.getOrCreateSession = asyncWrapper(async (req, res) => {
  const { siteId, language } = req.query;

  let session = await ChatSession.findOne({
    user: req.userId,
    site: siteId || null,
    isActive: true,
  }).populate('site', 'name province category fullStory significance historicalFacts');

  if (!session) {
    session = await ChatSession.create({
      user: req.userId,
      site: siteId || null,
      language: language || req.user.preferredLanguage || 'en',
      messages: [],
    });
  }

  res.status(200).json({ success: true, session });
});

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
exports.sendMessage = asyncWrapper(async (req, res, next) => {
  const { sessionId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) return next(new BadRequest('Message cannot be empty.'));

  const session = await ChatSession.findOne({ _id: sessionId, user: req.userId }).populate(
    'site',
    'name province category fullStory significance historicalFacts'
  );

  if (!session) return next(new NotFound('Chat session not found.'));

  // Add user message to history
  session.messages.push({ role: 'user', content: message });

  // Build conversation for Claude API – keep last 20 messages to manage context
  const history = session.messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Call Anthropic Claude API
  let assistantReply = '';
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: buildSystemPrompt(session.site, session.language),
        messages: history,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      throw new Error(data.error?.message || 'AI service unavailable');
    }

    assistantReply = data.content?.[0]?.text || "I'm unable to respond right now. Please try again.";
  } catch (err) {
    console.error('Chatbot error:', err.message);
    assistantReply = "I'm experiencing a brief issue. Please try again in a moment.";
  }

  // Save assistant response
  session.messages.push({ role: 'assistant', content: assistantReply });

  // Cap stored history at 100 messages per session
  if (session.messages.length > 100) {
    session.messages = session.messages.slice(-100);
  }

  await session.save();

  res.status(200).json({
    success: true,
    reply: assistantReply,
    sessionId: session._id,
  });
});

// ─── GET SESSION HISTORY ──────────────────────────────────────────────────────
exports.getSessionHistory = asyncWrapper(async (req, res, next) => {
  const session = await ChatSession.findOne({
    _id: req.params.sessionId,
    user: req.userId,
  });
  if (!session) return next(new NotFound('Session not found.'));
  res.status(200).json({ success: true, messages: session.messages, language: session.language });
});

// ─── CLOSE SESSION ────────────────────────────────────────────────────────────
exports.closeSession = asyncWrapper(async (req, res, next) => {
  const session = await ChatSession.findOneAndUpdate(
    { _id: req.params.sessionId, user: req.userId },
    { isActive: false },
    { new: true }
  );
  if (!session) return next(new NotFound('Session not found.'));
  res.status(200).json({ success: true, message: 'Session closed.' });
});

// ─── GET ALL MY SESSIONS ──────────────────────────────────────────────────────
exports.getMySessions = asyncWrapper(async (req, res) => {
  const sessions = await ChatSession.find({ user: req.userId })
    .populate('site', 'name.en coverImage')
    .sort('-updatedAt')
    .select('site language isActive updatedAt messages')
    .limit(20);

  // Add last message preview
  const withPreview = sessions.map((s) => ({
    ...s.toObject(),
    lastMessage: s.messages[s.messages.length - 1] || null,
    messageCount: s.messages.length,
    messages: undefined,
  }));

  res.status(200).json({ success: true, sessions: withPreview });
});