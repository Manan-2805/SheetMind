const DEV_API_URL = "http://127.0.0.1:8000/api";

export const apiBaseUrl = window.__SHEETMIND_API_URL__ || DEV_API_URL;

export function datasourceSocketUrl(username: string): string {
  const url = new URL(`${apiBaseUrl}/ws/datasources`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("username", username);
  return url.href;
}

export function chartImageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return new URL(path.replace(/^\/?api\//, ""), `${apiBaseUrl}/`).href;
}
