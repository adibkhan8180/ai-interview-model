import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { Document } from "@langchain/core/documents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { createModel, createEmbeddings } from "../config/openai.js";
import {
  createIntroPrompt,
  createMainPrompt,
  createSkillsBasedIntroPrompt,
  createSkillsBasedMainPrompt,
  feedbackPrompt,
  finalFeedbackPrompt,
} from "../utils/prompts.js";
import { z } from "zod";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { jsonrepair } from "jsonrepair";

export class AIService {
  constructor() {
    this.model = createModel();
    this.embeddings = createEmbeddings();
  }

  async initializeVectorStore(jobDescription) {
    const docs = [new Document({ pageContent: jobDescription })];

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1500,
      chunkOverlap: 20,
    });

    const splitDocs = await splitter.splitDocuments(docs);
    return await MemoryVectorStore.fromDocuments(splitDocs, this.embeddings);
  }
  async createInterviewChain(jobDescription, interviewType, domain) {
    const vectorstore = await this.initializeVectorStore(jobDescription);
    const retriever = vectorstore.asRetriever({ k: 2 });

    const retrieverPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      [
        "user",
        "Given the conversation, generate a search query for job description information.",
      ],
    ]);

    const retrieverChain = await createHistoryAwareRetriever({
      llm: this.model,
      retriever,
      rephrasePrompt: retrieverPrompt,
    });

    const mainPrompt = createMainPrompt(interviewType, domain);
    const chain = await createStuffDocumentsChain({
      llm: this.model,
      prompt: mainPrompt,
    });

    return await createRetrievalChain({
      combineDocsChain: chain,
      retriever: retrieverChain,
    });
  }
  async createInterviewChainSkillsBased(skills, interviewType, domain) {
    const mainPrompt = createSkillsBasedMainPrompt(
      skills,
      interviewType,
      domain
    );

    return mainPrompt.pipe(this.model);
  }

  async askIntroQuestion(
    jobDescription,
    interviewType,
    domain,
    companyName,
    chatHistory,
    input
  ) {
    const vectorstore = await this.initializeVectorStore(jobDescription);
    const retriever = vectorstore.asRetriever({ k: 2 });

    const retrieverPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder("chat_history"),
      ["user", "{input}"],
      [
        "user",
        "Given the conversation, generate a search query for job description information.",
      ],
    ]);

    const retrieverChain = await createHistoryAwareRetriever({
      llm: this.model,
      retriever,
      rephrasePrompt: retrieverPrompt,
    });

    const introPrompt = createIntroPrompt(interviewType, domain, companyName);
    const introChain = await createStuffDocumentsChain({
      llm: this.model,
      prompt: introPrompt,
    });

    const chain = await createRetrievalChain({
      combineDocsChain: introChain,
      retriever: retrieverChain,
    });

    return await chain.invoke({
      input,
      chat_history: chatHistory,
    });
  }

  async askIntroQuestionSkillsBased(
    skills,
    interviewType,
    domain,
    companyName,
    chatHistory,
    jobRole,
    input
  ) {
    const skillsPrompt = createSkillsBasedIntroPrompt(
      skills,
      interviewType,
      domain,
      companyName,
      jobRole
    );

    // Use simple prompt pipe chain without document chaining
    const chain = skillsPrompt.pipe(this.model);

    return await chain.invoke({
      input,
      chat_history: chatHistory,
    });
  }

  async generateFeedback(studentAnswer, chatHistory) {
    const feedbackChain = feedbackPrompt.pipe(this.model);
    return await feedbackChain.invoke({
      input: studentAnswer,
      chat_history: chatHistory,
    });
  }

  async generateFinalAssessment(chatHistory) {
    const assessmentSchema = z.object({
      overall_score: z.number().min(0).max(100),
      level: z.enum(["Basic", "Competent", "High-Caliber"]),
      summary: z.string(),
      questions_analysis: z.array(
        z.object({
          question: z.string(),
          response: z.string(),
          feedback: z.string(),
          strengths: z.array(z.string()),
          improvements: z.array(z.string()),
          score: z.number().min(0).max(10),
          response_depth: z.enum(["Novice", "Intermediate", "Advanced"]),
        })
      ),
      coaching_scores: z.object({
        clarity_of_motivation: z.number().min(1).max(5),
        specificity_of_learning: z.number().min(1).max(5),
        career_goal_alignment: z.number().min(1).max(5),
      }),
      recommendations: z.array(z.string()),
      closure_message: z.string(),
    });

    try {
      console.log('Starting final assessment generation...');

      // STRATEGY 1: Direct JSON generation with explicit instructions
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Assessment attempt ${attempt}/3`);

        try {
          // MODIFIED: Use direct model call with very explicit JSON-only instructions
          const directChain = finalFeedbackPrompt.pipe(this.model);
          const response = await directChain.invoke({
            chat_history: chatHistory,
          });

          console.log('Raw response received, attempting to parse...');
          console.log('Response preview:', response.content.substring(0, 200) + '...');

          // ENHANCED: Better JSON extraction and cleaning
          const jsonResult = this.extractAndValidateJSON(response.content, assessmentSchema);

          if (jsonResult) {
            console.log(`Attempt ${attempt} succeeded with direct approach`);
            return { success: true, result: jsonResult };
          }

        } catch (attemptError) {
          console.warn(`Attempt ${attempt} failed:`, attemptError.message);

          // ADDED: Log the actual response for debugging
          if (attemptError.response) {
            console.log('Failed response preview:', attemptError.response.substring(0, 200) + '...');
          }
        }

        // ADDED: Brief delay between attempts
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // FALLBACK: If all attempts fail, generate a structured fallback
      console.log('All attempts failed, generating fallback assessment...');
      const fallbackResult = this.generateFallbackAssessment(chatHistory);
      console.log('Fallback assessment generated successfully');

      return { success: true, result: fallbackResult };

    } catch (error) {
      console.error("Critical error in final assessment generation:", error);

      // LAST RESORT: Return minimal valid structure
      return {
        success: false,
        result: {
          overall_score: 0,
          level: "Basic",
          summary: "Assessment could not be completed due to technical issues.",
          questions_analysis: [],
          coaching_scores: {
            clarity_of_motivation: 1,
            specificity_of_learning: 1,
            career_goal_alignment: 1,
          },
          recommendations: ["Please retake the interview for proper assessment."],
          closure_message: "We apologize for the technical difficulty. Please try again later.",
        }
      };
    }
  }

  // ENHANCED: Much more robust JSON extraction and validation
  extractAndValidateJSON(responseContent, schema) {
    try {
      console.log('Extracting JSON from response...');
      console.log('Response preview:', responseContent.substring(0, 100) + '...');

      // STEP 1: Remove any markdown formatting
      let cleaned = responseContent
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*json\s*/gi, '')
        .trim();

      // STEP 2: Find JSON boundaries more aggressively
      let jsonStart = cleaned.indexOf('{');
      let jsonEnd = -1;

      if (jsonStart !== -1) {
        // Count braces to find the matching closing brace
        let braceCount = 0;
        for (let i = jsonStart; i < cleaned.length; i++) {
          if (cleaned[i] === '{') braceCount++;
          if (cleaned[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              jsonEnd = i + 1;
              break;
            }
          }
        }
      }

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No complete JSON object found in response');
      }

      cleaned = cleaned.substring(jsonStart, jsonEnd);

      // STEP 3: Try to repair common JSON issues
      try {
        cleaned = jsonrepair(cleaned);
        console.log('JSON repair successful');
      } catch (repairError) {
        console.warn('JSON repair failed, using original:', repairError.message);
      }

      // STEP 4: Parse and validate
      const parsed = JSON.parse(cleaned);
      const validated = schema.parse(parsed);

      console.log('JSON extraction and validation successful');
      return validated;

    } catch (error) {
      console.error('JSON extraction failed:', error.message);
      // Store the response for debugging
      error.response = responseContent;
      throw error;
    }
  }

  // ENHANCED: Better fallback assessment generation based on actual chat history
  generateFallbackAssessment(chatHistory) {
    console.log('Generating enhanced fallback assessment...');
    console.log('Chat history received:', chatHistory.length, 'messages');

    // FIXED: Better Q&A pair extraction logic
    const qaPairs = [];

    for (let i = 0; i < chatHistory.length - 1; i++) {
      const currentMessage = chatHistory[i];
      const nextMessage = chatHistory[i + 1];

      // Look for AI question followed by human response
      if (currentMessage.role === 'ai' && nextMessage.role === 'human') {
        // Check if AI message looks like a question
        const aiContent = currentMessage.content.toLowerCase();
        if (aiContent.includes('?') ||
          aiContent.includes('tell me') ||
          aiContent.includes('can you') ||
          aiContent.includes('what') ||
          aiContent.includes('how') ||
          aiContent.includes('why') ||
          aiContent.includes('describe') ||
          aiContent.includes('explain') ||
          aiContent.includes('share')) {

          qaPairs.push({
            question: currentMessage.content,
            response: nextMessage.content
          });
        }
      }
    }

    console.log(`Found ${qaPairs.length} Q&A pairs for analysis`);

    // ENHANCED: Generate analysis for each Q&A pair with better scoring
    const questionsAnalysis = qaPairs.map((qa, index) => {
      const responseLength = qa.response.length;
      const hasSpecificExamples = qa.response.toLowerCase().includes('project') ||
        qa.response.toLowerCase().includes('experience') ||
        qa.response.toLowerCase().includes('example') ||
        qa.response.toLowerCase().includes('developed') ||
        qa.response.toLowerCase().includes('worked');
      const isStructured = qa.response.includes('.') && responseLength > 50;
      const hasNumbers = /\d/.test(qa.response);
      const hasTechnicalTerms = qa.response.toLowerCase().includes('api') ||
        qa.response.toLowerCase().includes('database') ||
        qa.response.toLowerCase().includes('framework') ||
        qa.response.toLowerCase().includes('technology');

      // IMPROVED: Calculate score based on multiple quality indicators
      let score = 3; // Base score
      if (responseLength > 50) score += 1;
      if (responseLength > 100) score += 1;
      if (responseLength > 200) score += 1;
      if (hasSpecificExamples) score += 2;
      if (isStructured) score += 1;
      if (hasNumbers) score += 0.5;
      if (hasTechnicalTerms) score += 0.5;
      score = Math.min(10, Math.max(1, Math.round(score)));

      // IMPROVED: Determine response depth based on multiple factors
      let responseDepth = "Novice";
      if (responseLength > 80 && (hasSpecificExamples || isStructured)) {
        responseDepth = "Intermediate";
      }
      if (responseLength > 150 && hasSpecificExamples && isStructured && (hasNumbers || hasTechnicalTerms)) {
        responseDepth = "Advanced";
      }

      return {
        question: qa.question,
        response: qa.response,
        feedback: `Response ${index + 1}: ${this.generateBasicFeedback(qa.response, score)}`,
        strengths: this.identifyStrengths(qa.response),
        improvements: this.identifyImprovements(qa.response, score),
        score: score,
        response_depth: responseDepth
      };
    });

    // FIXED: Calculate overall metrics properly
    const averageScore = questionsAnalysis.length > 0
      ? questionsAnalysis.reduce((sum, q) => sum + q.score, 0) / questionsAnalysis.length
      : 3;

    const overallScore = Math.round(averageScore * 10);

    let level = "Basic";
    if (averageScore >= 7) level = "High-Caliber";
    else if (averageScore >= 5) level = "Competent";

    // ENHANCED: Better summary generation
    const summary = questionsAnalysis.length > 0
      ? `Interview completed with ${questionsAnalysis.length} questions answered. Overall performance demonstrates ${level.toLowerCase()} level responses with an average score of ${averageScore.toFixed(1)}/10. ${this.generatePerformanceSummary(questionsAnalysis)}`
      : `Interview session completed. Limited interaction detected for comprehensive assessment.`;

    return {
      overall_score: overallScore,
      level: level,
      summary: summary,
      questions_analysis: questionsAnalysis,
      coaching_scores: {
        clarity_of_motivation: Math.min(5, Math.max(1, Math.round(averageScore * 0.7))),
        specificity_of_learning: Math.min(5, Math.max(1, Math.round(averageScore * 0.6))),
        career_goal_alignment: Math.min(5, Math.max(1, Math.round(averageScore * 0.8))),
      },
      recommendations: this.generateRecommendations(questionsAnalysis, averageScore),
      closure_message: questionsAnalysis.length > 0
        ? `Thank you for participating in this mock interview. You answered ${questionsAnalysis.length} questions with an overall score of ${overallScore}/100. ${this.generateClosureMessage(level, averageScore)}`
        : "Thank you for your participation. We recommend completing a full interview session for comprehensive feedback."
    };
  }

  // ADDED: Generate performance summary based on analysis
  generatePerformanceSummary(questionsAnalysis) {
    const avgDepth = questionsAnalysis.reduce((acc, q) => {
      const depthScore = q.response_depth === "Advanced" ? 3 : q.response_depth === "Intermediate" ? 2 : 1;
      return acc + depthScore;
    }, 0) / questionsAnalysis.length;

    if (avgDepth >= 2.5) return "Responses showed strong technical depth and clear communication.";
    if (avgDepth >= 1.5) return "Responses demonstrated good understanding with room for more detail.";
    return "Responses were basic and would benefit from more specific examples and detail.";
  }

  // ADDED: Generate appropriate closure message
  generateClosureMessage(level, averageScore) {
    if (level === "High-Caliber") return "Excellent performance! Continue practicing to maintain this high standard.";
    if (level === "Competent") return "Good performance with clear potential. Focus on the recommendations to reach the next level.";
    return "Keep practicing! Focus on providing more detailed responses with specific examples.";
  }

  // ADDED: Helper methods for better fallback assessment
  generateBasicFeedback(response, score) {
    if (score >= 8) return "Excellent response with good detail and structure.";
    if (score >= 6) return "Good response but could benefit from more specific examples.";
    if (score >= 4) return "Adequate response but needs more detail and structure.";
    return "Response needs significant improvement in detail and clarity.";
  }

  identifyStrengths(response) {
    const strengths = [];
    if (response.length > 100) strengths.push("Provided detailed response");
    if (response.toLowerCase().includes('project') || response.toLowerCase().includes('experience')) strengths.push("Included relevant examples");
    if (response.includes('.') && response.split('.').length > 2) strengths.push("Well-structured answer");
    if (response.toLowerCase().includes('learn') || response.toLowerCase().includes('improve')) strengths.push("Shows growth mindset");
    if (/\d/.test(response)) strengths.push("Included specific details/metrics");

    return strengths.length > 0 ? strengths : ["Participated actively in the interview"];
  }

  identifyImprovements(response, score) {
    const improvements = [];
    if (response.length < 100) improvements.push("Provide more detailed responses");
    if (!response.toLowerCase().includes('project') && !response.toLowerCase().includes('experience')) improvements.push("Include specific examples from experience");
    if (score < 6) improvements.push("Use structured approach like STAR method");
    if (!response.includes('.') || response.split('.').length < 2) improvements.push("Organize thoughts more clearly");
    if (!/\d/.test(response) && score < 7) improvements.push("Include specific metrics or numbers when relevant");

    return improvements.length > 0 ? improvements : ["Continue practicing interview skills"];
  }

  generateRecommendations(questionsAnalysis, avgScore) {
    const recommendations = [];

    if (avgScore < 6) {
      recommendations.push("Practice providing more detailed and structured responses");
      recommendations.push("Prepare specific examples from your experience using the STAR method");
    }

    const hasLowDetailResponses = questionsAnalysis.some(q => q.response.length < 100);
    if (hasLowDetailResponses) {
      recommendations.push("Work on expanding your answers with more context and details");
    }

    const lacksExamples = questionsAnalysis.some(q =>
      !q.response.toLowerCase().includes('project') &&
      !q.response.toLowerCase().includes('experience') &&
      !q.response.toLowerCase().includes('example')
    );
    if (lacksExamples) {
      recommendations.push("Prepare concrete examples from your projects and experiences");
    }

    const hasBasicDepth = questionsAnalysis.some(q => q.response_depth === "Novice");
    if (hasBasicDepth) {
      recommendations.push("Focus on providing more comprehensive answers with technical details");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue practicing to maintain your strong interview performance");
      recommendations.push("Consider mock interviews for advanced scenarios");
    }

    return recommendations;
  }
}
