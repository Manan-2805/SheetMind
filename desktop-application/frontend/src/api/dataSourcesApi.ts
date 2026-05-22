import axios, { type AxiosResponse } from "axios";

import type {
  AutocompleteResponse,
  DataSource,
  DataSourcePreview,
} from "@/types/DataSource";

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

export async function getDataSources(): Promise<DataSource[]> {
  try {
    const res: AxiosResponse<DataSource[]> = await client.get("/data-sources");
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function uploadFile(file: File): Promise<DataSource> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res: AxiosResponse<DataSource> = await client.post(
      "/data-sources/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function deleteDataSource(id: string): Promise<void> {
  try {
    await client.delete(`/data-sources/${id}`);
  } catch (error) {
    handleError(error);
  }
}

export async function getDataSourcePreview(
  id: string,
  sheet?: string
): Promise<DataSourcePreview> {
  try {
    const params = sheet ? `?sheet=${encodeURIComponent(sheet)}` : "";
    const res: AxiosResponse<DataSourcePreview> = await client.get(
      `/data-sources/${id}/preview${params}`
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function listForAutocomplete(): Promise<AutocompleteResponse> {
  try {
    const res: AxiosResponse<AutocompleteResponse> = await client.get(
      "/data-sources/list-for-autocomplete"
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}

export async function uploadFromUrl(url: string): Promise<DataSource> {
  try {
    const res: AxiosResponse<DataSource> = await client.post(
      "/data-sources/upload-from-url",
      { url }
    );
    return res.data;
  } catch (error) {
    handleError(error);
  }
}
