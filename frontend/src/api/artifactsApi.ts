import axios, { type AxiosResponse } from "axios";

import type { ArtifactsResponse } from "@/types/Artifact";

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
