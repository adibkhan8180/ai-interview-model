import { InterviewService } from "../services/interviewService.js";

const interviewService = new InterviewService();

export const startInterview = async (req, res, next) => {
  try {
    const {
      companyName,
      jobRole,
      jobDescription,
      skills,
      inputType,
      interviewType,
      domain,
      hrRoundType,
    } = req.body;

    if (interviewType === "HR") {
      if (!hrRoundType) {
        return res.status(400).json({
          success: false,
          message: "HR Round Type (situational, stress, behavioral) is required",
        });
      }
    } else {
      if (interviewType === "domain-specific" && !domain) {
        return res.status(400).json({
          success: false,
          message: "Domain is required for domain specific interviews",
        });
      }
      if (inputType === "skills-based" && (!skills || !skills.length)) {
        return res.status(400).json({
          success: false,
          message: "At least one skill is required for Skills-based interviews",
        });
      }
    }

    const result = await interviewService.startInterview(
      companyName,
      interviewType === "domain-specific" ? jobRole : null,
      inputType ?? null,
      inputType === "job-description" ? jobDescription : "",
      inputType === "skills-based" ? skills : [],
      interviewType,
      interviewType === "domain-specific" ? domain : null,
      interviewType === "HR" ? hrRoundType : null
    );

    const introQuestion = await interviewService.getIntroQuestion(
      result?.sessionId
    );

    res.status(201).json({
      success: true,
      sessionId: result.sessionId,
      question: introQuestion,
    });
  } catch (error) {
    next(error);
  }
};

export const getNextQuestion = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.getNextQuestion(sessionId);
    res.status(200).json({
      success: true,
      question: result,
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
      feedback: result.feedback,
    });
  } catch (error) {
    next(error);
  }
};

export const reviseAnswer = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.reviseAnswer(sessionId);
    res.json({
      success: true,
      message: "Previous Question To Revise Answer",
      question: result.question,
    });
  } catch (error) {
    next(error);
  }
};

export const submitInterview = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.submitInterview(sessionId);
    res.status(200).json({
      success: true,
      overallFeedback: result.feedback,
      status: result.status,
    });
  } catch (error) {
    console.error("Error in submitInterview:", error.message);
    next(error);
  }
};

export const getInterviewStatus = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const result = await interviewService.getInterviewStatus(sessionId);
    res.json({
      success: true,
      status: result,
    });
  } catch (error) {
    next(error);
  }
};
