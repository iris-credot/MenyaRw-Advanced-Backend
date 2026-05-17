const express = require('express');
const router = express.Router();
const {
  getOrCreateSession,
  sendMessage,
  getSessionHistory,
  closeSession,
  getMySessions,
  clearSession,
} = require('../Controllers/chatbotController');
const { protect } = require('../Middleware/auth');

router.use(protect);

router.get('/sessions', getMySessions);
router.get('/sessions/current', getOrCreateSession);
router.post('/sessions/:sessionId/message', sendMessage);
router.get('/sessions/:sessionId/history', getSessionHistory);
router.patch('/sessions/:sessionId/close', closeSession);
router.delete('/sessions/:sessionId/clear', clearSession);

module.exports = router;