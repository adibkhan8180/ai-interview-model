import express from 'express';
import { startInterview, getNextQuestion, postAnswer, getFeedback, reviseAnswer, submitInterview, getInterviewStatus } from '../controllers/interviewController.js';

const router = express.Router();

router.post('/interviews', startInterview);
router.get('/interviews/:sessionId/questions', getNextQuestion);
router.post('/interviews/:sessionId/answers', postAnswer);
router.get('/interviews/:sessionId/feedback', getFeedback);
router.post('/interviews/:sessionId/revise', reviseAnswer);
router.post('/interviews/:sessionId/submit', submitInterview);
router.get('/interviews/:sessionId/status', getInterviewStatus);

export default router;