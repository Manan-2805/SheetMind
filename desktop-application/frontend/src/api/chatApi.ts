import axios, { type AxiosResponse } from "axios";

import type { ArtifactExport } from "@/types/Artifact";
import type { ChatMessage, ChatSession, ResultTable } from "@/types/ChatMessage";

import { apiClient as client } from "./apiClient";

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
    const res: AxiosResponse<ChatSession[]> = await client.get("/chat/sessions");
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
  referencedFiles: string[],
  parentUserMessageId?: string
): Promise<ChatMessage> {
  try {
    const res: AxiosResponse<ChatMessage> = await client.post(
      `/chat/sessions/${sessionId}/messages`,
      { content, referenced_files: referencedFiles, parent_user_message_id: parentUserMessageId }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function updateSession(
  sessionId: string,
  data: { title?: string; is_favorite?: boolean }
): Promise<ChatSession> {
  try {
    const res: AxiosResponse<ChatSession> = await client.put(`/chat/sessions/${sessionId}`, data);
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await client.delete(`/chat/sessions/${sessionId}`);
  } catch (error) {
    handleError(error);
  }
}

export async function setMessageFeedback(
  messageId: string,
  feedback: "like" | "dislike",
  reason?: string
): Promise<void> {
  try {
    await client.put(`/chat/messages/${messageId}/feedback`, { feedback, reason });
  } catch (error) {
    handleError(error);
  }
}

export async function regenerateMessage(
  sessionId: string,
  content: string,
  referencedFiles: string[],
  reason: string = "",
  instruction: string = "",
  parentUserMessageId?: string
): Promise<ChatMessage> {
  try {
    const res: AxiosResponse<ChatMessage> = await client.post(
      `/chat/sessions/${sessionId}/regenerate`,
      {
        content,
        referenced_files: referencedFiles,
        reason,
        instruction,
        parent_user_message_id: parentUserMessageId,
      }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function getMessageData(messageId: string, page?: number): Promise<ResultTable> {
  try {
    const res: AxiosResponse<ResultTable> = await client.get(`/chat/messages/${messageId}/data`, {
      params: page ? { page } : undefined,
    });
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function exportMessage(messageId: string): Promise<ArtifactExport> {
  try {
    const res: AxiosResponse<ArtifactExport> = await client.post(
      `/chat/messages/${messageId}/export`
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function generateChart(params: {
  data: Record<string, unknown>[];
  chart_type: string;
  x_key: string;
  y_key: string;
  title?: string;
  colors?: string[];
  output_format?: string;
  value_key?: string;
}): Promise<Blob> {
  try {
    const res = await client.post("/chat/charts/generate", params, {
      responseType: "blob",
    });
    return res.data as Blob;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteMessageBranch(sessionId: string, messageId: string): Promise<void> {
  try {
    await client.delete(`/chat/sessions/${sessionId}/messages/${messageId}`);
  } catch (error) {
    handleError(error);
  }
}

export async function editMessage(
  sessionId: string,
  messageId: string,
  content: string,
  referencedFiles: string[]
): Promise<ChatMessage> {
  try {
    const res: AxiosResponse<ChatMessage> = await client.put(
      `/chat/sessions/${sessionId}/messages/${messageId}`,
      { content, referenced_files: referencedFiles }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}
