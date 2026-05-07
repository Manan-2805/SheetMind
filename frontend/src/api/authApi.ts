import axios, { type AxiosResponse } from "axios";

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

interface SetupResponse {
  username: string;
  created_at: string;
  is_new: boolean;
}

export async function listUsers(): Promise<string[]> {
  try {
    const res = await client.get<{ users: string[] }>("/auth/users");
    return res.data.users;
  } catch {
    return [];
  }
}

export async function setupUser(username: string): Promise<SetupResponse> {
  try {
    const res: AxiosResponse<SetupResponse> = await client.post("/auth/setup", {
      username,
    });
    return res.data;
  } catch (error) {
    handleError(error);
  }
}
