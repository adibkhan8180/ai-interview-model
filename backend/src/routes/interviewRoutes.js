import express from 'express';
import { startInterview, getNextQuestion, postAnswer, reviseAnswer, submitInterview, getInterviewStatus } from '../controllers/interviewController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { startInterviewSchema, postAnswerSchema, sessionIdParamSchema } from '../validators/interviewValidator.js';


const router = express.Router();

router.post('/interviews', validateBody(startInterviewSchema), startInterview);
router.get('/interviews/:sessionId/questions', validateParams(sessionIdParamSchema), getNextQuestion);
router.post('/interviews/:sessionId/answers', validateBody(postAnswerSchema), validateParams(sessionIdParamSchema), postAnswer);
router.get('/interviews/:sessionId/revise', validateParams(sessionIdParamSchema), reviseAnswer);
router.post('/interviews/:sessionId/submit', validateParams(sessionIdParamSchema), submitInterview);
router.get('/interviews/:sessionId/status', validateParams(sessionIdParamSchema), getInterviewStatus);

export default router;