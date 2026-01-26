import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import dotenv from "dotenv";

dotenv.config();

export const createModel = () => {
  return new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.5,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};

export const createEmbeddings = () => {
  return new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
};