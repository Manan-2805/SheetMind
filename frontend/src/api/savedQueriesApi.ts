import axios, { type AxiosResponse } from "axios";

import type { CreateSavedQueryRequest, SavedQuery } from "@/types/SavedQuery";

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

export async function getSavedQueries(): Promise<SavedQuery[]> {
  try {
    const res: AxiosResponse<SavedQuery[]> =
      await client.get("/saved-queries");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function createSavedQuery(
  data: CreateSavedQueryRequest
): Promise<SavedQuery> {
  try {
    const res: AxiosResponse<SavedQuery> = await client.post(
      "/saved-queries",
      data
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteSavedQuery(id: string): Promise<void> {
  try {
    await client.delete(`/saved-queries/${id}`);
  } catch (error) {
    handleError(error);
  }
}

export async function runSavedQuery(id: string): Promise<{ inserted_query: string }> {
  try {
    const res: AxiosResponse<{ inserted_query: string }> = await client.post(
      `/saved-queries/${id}/run`
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function generateLabel(
  nl_query: string,
  sql_query: string
): Promise<string> {
  try {
    const res: AxiosResponse<{ label: string }> = await client.post(
      "/saved-queries/generate-label",
      { nl_query, sql_query }
    );
    return res.data.label;
  } catch (error) {
    handleError(error);
  }
}
