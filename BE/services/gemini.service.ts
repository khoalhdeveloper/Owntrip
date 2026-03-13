import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const RETRYABLE_STATUS_CODES = new Set([429, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 700;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getStatusCode = (error: any): number | undefined => {
  if (!error) {
    return undefined;
  }

  const directStatus = error.status || error.statusCode || error?.response?.status;

  if (typeof directStatus === "number") {
    return directStatus;
  }

  const message = typeof error.message === "string" ? error.message : "";
  const match = message.match(/\[(\d{3})\s/);

  if (!match) {
    return undefined;
  }

  return Number(match[1]);
};

const isRetryableError = (error: any): boolean => {
  const statusCode = getStatusCode(error);
  return typeof statusCode === "number" && RETRYABLE_STATUS_CODES.has(statusCode);
};

const buildExternalError = (message: string, statusCode: number) => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
};

export const askTravelBot = async (message: string): Promise<string> => {

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `
Bạn là chatbot tư vấn du lịch Việt Nam.

Hãy:
- gợi ý địa điểm
- gợi ý lịch trình
- gợi ý món ăn
- trả lời ngắn gọn

Câu hỏi: ${message}
`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      const retryable = isRetryableError(error);
      const isLastAttempt = attempt === MAX_RETRIES;

      if (!retryable || isLastAttempt) {
        if (retryable) {
          throw buildExternalError(
            "Chatbot is temporarily busy due to high demand. Please try again in a moment.",
            503
          );
        }

        throw error;
      }

      const jitter = Math.floor(Math.random() * 250);
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + jitter;
      await sleep(delay);
    }
  }

  throw buildExternalError(
    "Chatbot is temporarily busy due to high demand. Please try again in a moment.",
    503
  );
};