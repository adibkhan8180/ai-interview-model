import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { InterviewSession } from "../../models/interviewSession.js";
import { AIService } from "./aiService.js";

export class InterviewService {
  constructor() {
    this.aiService = new AIService();
  }

  async startInterview(
    companyName,
    jobRole,
    jobDescription,
    interviewType,
    domain
  ) {
    const newSession = new InterviewSession({
      companyName,
      jobRole,
      jobDescription,
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

    const conversationChain = await this.aiService.createInterviewChain(
      session.jobDescription,
      session.interviewType,
      session.domain
    );

    const response = await conversationChain.invoke({
      input: "Generate the next question based on the conversation history.",
      chat_history: session.chatHistory.map((msg) =>
        msg.role === "human"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
    });

    session.chatHistory.push({ role: "ai", content: response.answer });
    await session.save();

    return response.answer;
  }

  async getIntroQuestion(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.chatHistory.length > 0)
      throw new Error("Intro question can only be asked at the beginning.");

    const input =
      "Start the interview with an introductory greeting and first question.";
    const response = await this.aiService.askIntroQuestion(
      session.jobDescription,
      session.interviewType,
      session.domain,
      session.companyName,
      session.chatHistory,
      input
    );

    session.chatHistory.push({ role: "ai", content: response.answer });
    await session.save();

    return response.answer;
  }

  async postAnswer(sessionId, answer) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

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

  async getFeedback(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const lastAnswer = session.chatHistory
      .filter((m) => m.role === "human")
      .slice(-1)[0]?.content;
    if (!lastAnswer)
      throw new Error("No answer found to provide feedback for.");

    const feedback = await this.aiService.generateFeedback(
      lastAnswer,
      session.chatHistory.map((msg) =>
        msg.role === "human"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      )
    );

    return feedback;
  }

  async reviseAnswer(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const lastMessage = session.chatHistory.pop();
    if (!lastMessage || lastMessage.role !== "human")
      throw new Error("No recent human answer to revise.");

    await session.save();

    const lastQuestion = session.chatHistory
      .filter((m) => m.role === "ai")
      .slice(-1)[0]?.content;
    return { question: lastQuestion };
  }

  async submitInterview(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    const feedback = await this.getFinalFeedback(sessionId);

    if (!feedback.success) {
      return { feedback: feedback.result, status: "error" };
    }

    session.overallFeedback = feedback.result;

    session.status = "completed";
    await session.save();

    return { feedback: feedback.result, status: session.status };
  }

  async getFinalFeedback(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    return await this.aiService.generateFinalAssessment(
      session.chatHistory.map((msg) =>
        msg.role === "human"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      )
    );
  }

  async getInterviewStatus(sessionId) {
    const session = await InterviewSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    return session.status;
  }
}
