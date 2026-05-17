const express = require('express');
const router = express.Router();
const {
  getOrCreateSession, sendMessage, getSessionHistory,
  closeSession, getMySessions,
} = require('../Controllers/chatbotController');
const { protect } = require('../Middleware/auth');

router.use(protect);

router.get('/sessions', getMySessions);
router.get('/sessions/current', getOrCreateSession);   // GET or create a session
router.post('/sessions/:sessionId/message', sendMessage);
router.get('/sessions/:sessionId/history', getSessionHistory);
router.patch('/sessions/:sessionId/close', closeSession);

module.exports = router;