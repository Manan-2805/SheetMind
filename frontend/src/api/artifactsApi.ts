import axios, { type AxiosResponse } from "axios";

import type { ArtifactExport, ArtifactsResponse } from "@/types/Artifact";
import type { ResultTable } from "@/types/ChatMessage";

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

export async function getArtifacts(): Promise<ArtifactsResponse> {
  try {
    const res: AxiosResponse<ArtifactsResponse> =
      await client.get("/artifacts");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteArtifact(id: string): Promise<void> {
  try {
    await client.delete(`/artifacts/${id}`);
  } catch (error) {
    handleError(error);
  }
}

export async function renameArtifact(id: string, title: string): Promise<ArtifactExport> {
  try {
    const res: AxiosResponse<ArtifactExport> = await client.put(
      `/artifacts/${id}`,
      { title }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function getArtifactData(id: string): Promise<ResultTable> {
  try {
    const res: AxiosResponse<ResultTable> = await client.get(
      `/artifacts/${id}/data`
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export function downloadArtifactUrl(id: string): string {
  const base = client.defaults.baseURL ?? "";
  return `${base}/artifacts/${id}/download`;
}
