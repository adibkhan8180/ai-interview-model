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
    const finalChain = finalFeedbackPrompt.pipe(this.model);

    let response;
    try {
      response = await finalChain.invoke({
        chat_history: chatHistory,
      });
    } catch (err) {
      console.error("LLM call failed:", err.message);
      return {
        success: false,
        result: "Model error during final assessment.",
      };
    }

    let jsonContent = response.content;

    // Extract JSON if surrounded by extra text
    const jsonMatch = jsonContent.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      jsonContent = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonContent);

      // Optional: Check structure here (fields like summary, score, etc.)
      // if (!parsed || typeof parsed !== "object") {
      //   throw new Error("Parsed content is not an object");
      // }

      return { success: true, result: jsonContent };
    } catch (error) {
      console.error(
        "Failed to parse final assessment:",
        error.message,
        "\nRaw output:\n",
        response.content
      );

      return {
        success: false,
        result: response.content,
      };
    }
  }

}
