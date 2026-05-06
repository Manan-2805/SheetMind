import axios, { type AxiosResponse } from "axios";

import type { ChatMessage, ChatSession } from "@/types/ChatMessage";

const client = axios.create({ baseURL: "http://localhost:8000/api" });

interface ApiError {
  status: number;
  message: string;
}

function handleError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";
    throw { status, message } satisfies ApiError;
  }
  throw { status: 0, message: "Network error" } satisfies ApiError;
}

export async function getSessions(): Promise<ChatSession[]> {
  try {
    const res: AxiosResponse<ChatSession[]> = await client.get(
      "/chat/sessions"
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const res: AxiosResponse<ChatMessage[]> = await client.get(
      `/chat/sessions/${sessionId}/messages`
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function createSession(): Promise<ChatSession> {
  try {
    const res: AxiosResponse<ChatSession> = await client.post("/chat/sessions");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function sendMessage(
  sessionId: string,
  content: string,
  referencedFiles: string[]
): Promise<ChatMessage> {
  try {
    const res: AxiosResponse<ChatMessage> = await client.post(
      `/chat/sessions/${sessionId}/messages`,
      { content, referenced_files: referencedFiles }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}
