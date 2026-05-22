import axios, { type AxiosResponse } from "axios";

import type {
  PullModelResponse,
  Settings,
  TestLLMRequest,
  TestLLMResponse,
} from "@/types/Settings";

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

export async function getSettings(): Promise<Settings> {
  try {
    const res: AxiosResponse<Settings> = await client.get("/settings");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  try {
    const res: AxiosResponse<Settings> = await client.put("/settings", data);
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function testLLM(data: TestLLMRequest): Promise<TestLLMResponse> {
  try {
    const res: AxiosResponse<TestLLMResponse> = await client.post(
      "/settings/test-llm",
      data
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function getOllamaModels(): Promise<{ models: { name: string }[] }> {
  try {
    const res = await client.get("/settings/ollama-models");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function pullOllamaModel(
  modelName: string
): Promise<PullModelResponse> {
  try {
    const res: AxiosResponse<PullModelResponse> = await client.post(
      "/settings/pull-ollama-model",
      { model_name: modelName }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function clearChatHistory(): Promise<{ success: boolean; deleted_sessions: number }> {
  try {
    const res = await client.post("/settings/clear-chat-history");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteAllFiles(): Promise<{ success: boolean; deleted_files: number }> {
  try {
    const res = await client.post("/settings/delete-all-files");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function exportSettings(): Promise<void> {
  try {
    const res = await client.get("/settings/export", {
      responseType: "blob",
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sheetmind-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    handleError(error);
  }
}

export async function importSettings(file: File): Promise<{ success: boolean }> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await client.post("/settings/import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    handleError(error);
  }
}
