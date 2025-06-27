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
      overall_score: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "Overall score evaluated by rubric's method based on the scores of all question-answer pairs from the questions_analysis array and the coaching scores."
        ),

      level: z.enum(["Basic", "Competent", "High-Caliber"]),

      summary: z
        .string()
        .describe(
          "Brief summary of the candidate's overall interview performance."
        ),

      questions_analysis: z.array(
        z.object({
          question: z
            .string()
            .describe("Question asked by the AI interviewer."),
          response: z
            .string()
            .describe("Exact response provided by the student."),
          feedback: z
            .string()
            .describe(
              "Detailed feedback based on the question and response pair."
            ),
          strengths: z
            .array(z.string())
            .describe("Strengths identified in the student's response."),
          improvements: z
            .array(z.string())
            .describe("Areas for improvement in the student's response."),
          score: z
            .number()
            .min(0)
            .max(10)
            .describe(
              "Score for the response according to the rubric's method."
            ),
          response_depth: z.enum(["Novice", "Intermediate", "Advanced"]),
        })
      ),

      coaching_scores: z
        .object({
          clarity_of_motivation: z
            .number()
            .min(1)
            .max(5)
            .describe(
              "Score (1 to 5) reflecting how clearly the student expressed their motivation or reasons for applying."
            ),

          specificity_of_learning: z
            .number()
            .min(1)
            .max(5)
            .describe(
              "Score (1 to 5) indicating how specifically the student articulated what they have learned or intend to learn."
            ),

          career_goal_alignment: z
            .number()
            .min(1)
            .max(5)
            .describe(
              "Score (1 to 5) evaluating how well the student's answers and aspirations align with their stated career goals."
            ),
        })
        .describe(
          "Coaching scores providing additional evaluation of the student's motivation, learning clarity, and career goal alignment."
        ),

      recommendations: z
        .array(z.string())
        .describe(
          "Summary of key recommendations derived from the improvements across all questions."
        ),

      closure_message: z
        .string()
        .describe("Friendly, personalized closing message for the student."),
    });




    try {

      console.log('1====>>>>', chatHistory)

      const outputParser = StructuredOutputParser.fromZodSchema(assessmentSchema);
      console.log('2====>>>>')

      const finalChain = finalFeedbackPrompt.pipe(this.model).pipe(outputParser);
      const format_instructions= outputParser.getFormatInstructions();
      console.log('3===>>>', format_instructions)
      const result = await finalChain.invoke({
        format_instructions: outputParser.getFormatInstructions(),
        chat_history: chatHistory,
      });
      console.log('4====>>>>')
      console.log('result===>>>', result)

      return { success: true, result };
    } catch (error) {
      console.error("Failed to generate final assessment:", error);
      return {
        success: false,
        result: "Assessment generation failed due to invalid output format.",
      };
    }
  }


  // async generateFinalAssessment(chatHistory) {
  //   const finalChain = finalFeedbackPrompt.pipe(this.model);

  //   let response;
  //   try {
  //     response = await finalChain.invoke({ chat_history: chatHistory });
  //   } catch (err) {
  //     console.error("LLM call failed:", err.message);
  //     return { success: false, result: "Model error during final assessment." };
  //   }

  //   const rawOutput = response.content;
  //   console.log("🔍 Raw AI Output:\n", rawOutput); // for debugging

  //   let fixedJson, parsed;

  //   try {
  //     // Use jsonrepair to fix broken strings/quotes
  //     fixedJson = jsonrepair(rawOutput);
  //     parsed = JSON.parse(fixedJson);
  //   } catch (err) {
  //     console.error("❌ Failed to repair or parse JSON:", err.message);
  //     return { success: false, result: null };
  //   }

  //   // If LLM wrongly returns array instead of object
  //   if (Array.isArray(parsed)) {
  //     if (parsed.length === 1 && typeof parsed[0] === "object") {
  //       console.warn("⚠️ Wrapped object in array, auto-unwrapped");
  //       parsed = parsed[0];
  //     } else {
  //       console.error("❌ Parsed value is an array, expected object.");
  //       return { success: false, result: null };
  //     }
  //   }

  //   if (typeof parsed !== "object" || parsed === null) {
  //     console.error("❌ Parsed value is not a valid object");
  //     return { success: false, result: null };
  //   }

  //   const validation = finalFeedbackSchema.safeParse(parsed);

  //   if (!validation.success) {
  //     console.error("❌ Zod validation failed:", validation.error.issues);
  //     console.log("🛠️ Final Parsed JSON for reference:", parsed);
  //     return { success: false, result: null };
  //   }

  //   return { success: true, result: validation.data };
  // }




}
