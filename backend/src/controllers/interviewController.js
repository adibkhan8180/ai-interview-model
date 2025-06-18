import { InterviewService } from '../services/interviewService.js';

const interviewService = new InterviewService();

export const startInterview = async (req, res, next) => {
  try {
    const { companyName, jobRole, jobDescription, interviewType, domain } = req.body;
    if (interviewType === 'domain_specific' && !domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required for domain specific interviews'
      });
    }

    const result = await interviewService.startInterview(
      companyName,
      jobRole,
      jobDescription,
      interviewType,
      interviewType === 'domain_specific' ? domain : null
    );

    res.status(201).json({
      success: true,
      sessionId: result.sessionId
    });
  } catch (error) {
    next(error);
  }
};

export const getNextQuestion = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.getNextQuestion(sessionId);
    res.json({
      success: true,
      question: result
    });
  } catch (error) {
    next(error);
  }
};

export const postAnswer = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const { answer } = req.body;
    const result = await interviewService.postAnswer(sessionId, answer);
    res.json({
      success: true,
      feedback: result.feedback
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedback = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.getFeedback(sessionId);
    res.json({
      success: true,
      feedback: result
    });
  } catch (error) {
    next(error);
  }
};

export const reviseAnswer = async (req, res, next) => {
  try {
    // console.log("im inside revise");
    const sessionId = req.params.sessionId;
    const result = await interviewService.reviseAnswer(sessionId, req.body.answer);
    // console.log(req.body.answer);
    res.json({
      success: true,
      message: 'Answer revised successfully',
      feedback: result.feedback
    });
  } catch (error) {
    next(error);
  }
};

export const submitInterview = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.submitInterview(sessionId);
    res.json({
      success: true,
      feedback: result.feedback,
      status: result.status
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewStatus = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.getInterviewStatus(sessionId);
    res.json({
      success: true,
      status: result
    });
  } catch (error) {
    next(error);
  }
};