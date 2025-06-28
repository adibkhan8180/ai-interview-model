import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { InterviewSession } from "../../models/interviewSession.js";
import { AIService } from "./aiService.js";
import { AppError } from "../utils/AppError.js";

export class InterviewService {
  constructor() {
    this.aiService = new AIService();
  }

  async startInterview(
    companyName,
    jobRole,
    inputType,
    jobDescription,
    skills,
    interviewType,
    domain
  ) {
    const newSession = new InterviewSession({
      companyName,
      jobRole,
      inputType,
      jobDescription,
      skills,
      interviewType,
      domain,
      chatHistory: [],
      status: "active",
      currentStep: "questioning",
    });

    const savedSession = await newSession.save();

    return { sessionId: savedSession._id.toString() };
  }

  async getNextQuestion(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    if (session.status === "completed") {
      throw new AppError("Interview is already completed, can not get next question", 400);
    }

    let conversationChain;

    if (session.inputType === "skills-based") {
      conversationChain = await this.aiService.createInterviewChainSkillsBased(
        session.skills,
        session.interviewType,
        session.domain
      );
    } else {
      conversationChain = await this.aiService.createInterviewChain(
        session.jobDescription,
        session.interviewType,
        session.domain
      );
    }

    const response = await conversationChain.invoke({
      input: "Generate the next question based on the conversation history.",
      chat_history: session.chatHistory.map((msg) =>
        msg.role === "human"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
    });

    if (session.inputType === "skills-based") {
      session.chatHistory.push({ role: "ai", content: response.content });
      await session.save();

      return response.content;
    } else {
      session.chatHistory.push({ role: "ai", content: response.answer });
      await session.save();

      return response.answer;
    }
  }

  async getIntroQuestion(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.chatHistory.length > 0)
      throw new Error("Intro question can only be asked at the beginning.");

    const input =
      "Start the interview with an introductory greeting and first question.";

    let response;
    let data;

    if (session.inputType === "skills-based") {
      // Skills-based flow
      response = await this.aiService.askIntroQuestionSkillsBased(
        session.skills,
        session.interviewType,
        session.domain,
        session.companyName,
        session.chatHistory,
        session.jobRole,
        input
      );
      data = response.content;
    } else {
      // JD-based flow
      response = await this.aiService.askIntroQuestion(
        session.jobDescription,
        session.interviewType,
        session.domain,
        session.companyName,
        session.chatHistory,
        input
      );
      data = response.answer;
    }

    session.chatHistory.push({ role: "ai", content: data });
    await session.save();

    return data;
  }

  async postAnswer(sessionId, answer) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    if (session.status === "completed") {
      throw new AppError("Interview is already completed, can not post answer", 400);
    }

    session.chatHistory.push({ role: "human", content: answer });

    const feedbackResponse = await this.aiService.generateFeedback(
      answer,
      session.chatHistory.map((msg) =>
        msg.role === "human"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      )
    );

    session.currentStep = "feedback";
    session.lastFeedback = feedbackResponse.content;
    await session.save();

    return { feedback: feedbackResponse.content };
  }

  async reviseAnswer(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    if (session.status === "completed") {
      throw new AppError("Interview is already completed, can not revise answer", 400);
    }

    const lastMessage = session.chatHistory.pop();
    if (!lastMessage || lastMessage.role !== "human")
      throw new AppError("No recent human answer to revise.", 400);

    session.currentStep = "revise";
    await session.save();

    const lastQuestion = session.chatHistory
      .filter((m) => m.role === "ai")
      .slice(-1)[0]?.content;
    return { question: lastQuestion };
  }

  // FIXED: Prevent multiple submissions and cache results
  async submitInterview(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new AppError("Session not found", 400);

    console.log('Starting interview submission for session:', sessionId);

    // ADDED: Check if interview is already completed and return cached result
    if (session.status === "completed" && session.overallFeedback) {
      console.log('Interview already completed, returning cached feedback');
      return {
        feedback: session.overallFeedback,
        status: session.status,
      };
    }

    // ADDED: Prevent concurrent submissions by setting status immediately
    if (session.status === "submitting") {
      throw new AppError("Interview submission is already in progress", 400);
    }

    // ADDED: Set status to submitting to prevent concurrent requests
    session.status = "submitting";
    await session.save();

    try {
      // MODIFIED: Direct call to getFinalFeedback without complex retry logic
      const feedback = await this.getFinalFeedback(sessionId);

      // ADDED: Better validation of feedback result
      if (!feedback || !feedback.success) {
        console.warn('Final feedback generation failed, using fallback');
        // The aiService now handles fallbacks internally, so we should still get a result
      }

      // MODIFIED: Always save the result, even if it's a fallback
      session.overallFeedback = feedback.result;
      session.status = "completed";
      await session.save();

      console.log('Interview submission completed successfully');

      return {
        feedback: feedback.result,
        status: session.status,
      };

    } catch (error) {
      // ADDED: Reset status on error so user can retry
      session.status = "active";
      await session.save();
      throw error;
    }
  }

  // MODIFIED: Enhanced error handling and logging in getFinalFeedback
  async getFinalFeedback(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new AppError("Session not found", 400);

    try {
      console.log('Generating final feedback for session:', sessionId);
      console.log('Chat history length:', session.chatHistory.length);

      const result = await this.aiService.generateFinalAssessment(
        session.chatHistory.map((msg) =>
          msg.role === "human"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
        )
      );

      console.log('Final feedback generation completed:', result.success ? 'SUCCESS' : 'FAILED');
      return result;

    } catch (err) {
      console.error("AI feedback generation error:", err.message);
      console.error("Error stack:", err.stack);

      // MODIFIED: Return a structured fallback instead of null
      return {
        success: false,
        result: {
          overall_score: 50,
          level: "Basic",
          summary: "Technical error occurred during assessment generation.",
          questions_analysis: [],
          coaching_scores: {
            clarity_of_motivation: 3,
            specificity_of_learning: 3,
            career_goal_alignment: 3,
          },
          recommendations: ["Please retake the interview for proper assessment."],
          closure_message: "Thank you for your participation. Please try again later.",
        }
      };
    }
  }

  async getInterviewStatus(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    return session.status;
  }
}
