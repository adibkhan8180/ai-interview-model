import { v4 as uuidv4 } from "uuid";
import { storage } from "../config/database.js";
import { AIService } from "./aiService.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

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
    const sessionId = uuidv4();

    // Create interview chain
    const conversationChain = await this.aiService.createInterviewChain(
      jobDescription,
      interviewType,
      domain
    );

    // Store session in in-memory storage
    storage.createSession(sessionId, {
      companyName,
      jobRole,
      jobDescription,
      interviewType,
      domain,
      chatHistory: [],
      conversationChain,
      status: "active",
      currentStep: "questioning",
    });

    return { sessionId };
  }

  async getNextQuestion(sessionId) {
    console.log("session id in get question api", sessionId);
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const initialPrompt =
      session.chatHistory.length === 0
        ? "Start the interview with an introductory greeting and first question."
        : "Generate the next question based on the conversation history.";

    const response = await session.conversationChain.invoke({
      input: initialPrompt,
      chat_history: session.chatHistory,
    });


    session.chatHistory.push(new AIMessage(response.answer));

    return response.answer;
  }

  async postAnswer(sessionId, answer) {
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    let { chatHistory } = session;

    /*
          console.log('Answer:', answer);
          console.log("human message:", new HumanMessage(answer)); */

    // Add student answer to history
    chatHistory.push(new HumanMessage(answer));

    // Generate feedback
    const feedbackResponse = await this.aiService.generateFeedback(
      answer,
      chatHistory
    );

    // Update session in in-memory storage
    storage.updateSession(sessionId, {
      chatHistory,
      currentStep: "feedback",
      lastFeedback: feedbackResponse.content,
    });
    console.log("Chat history:", chatHistory);


    return { feedback: feedbackResponse.content };
  }

  async getFeedback(sessionId) {
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const chatHistory = session.chatHistory;
    const lastAnswer = chatHistory.slice(-1)[0].answer;
    const feedback = await this.aiService.generateFeedback(
      lastAnswer,
      chatHistory
    );

    return feedback;
  }

  async reviseAnswer(sessionId) {
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    let { chatHistory } = session;

    chatHistory.pop();

    return { question: chatHistory[chatHistory.length - 1].content };
  }

  async submitInterview(sessionId) {
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const feedback = await this.getFinalFeedback(sessionId);
    session.status = "completed";
    storage.updateSession(sessionId, session);

    return { feedback, status: session.status };
  }

  async getFinalFeedback(sessionId) {
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const chatHistory = session.chatHistory;
    const feedback = await this.aiService.generateFinalAssessment(chatHistory);

    return feedback;
  }

  async getInterviewStatus(sessionId) {
    const session = storage.getSession(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    return session.status;
  }
}
