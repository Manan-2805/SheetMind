const DEV_API_URL = "http://127.0.0.1:8000/api";

export const apiBaseUrl = window.__SHEETMIND_API_URL__ || DEV_API_URL;
export const apiToken = window.__SHEETMIND_API_TOKEN__;

export function datasourceSocketUrl(username: string): string {
  const url = new URL(`${apiBaseUrl}/ws/datasources`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("username", username);
  if (apiToken) url.searchParams.set("api_token", apiToken);
  return url.href;
}

export function chartImageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const url = new URL(path.replace(/^\/?api\//, ""), `${apiBaseUrl}/`);
  const base = new URL(apiBaseUrl);
  if (
    apiToken &&
    url.origin === base.origin &&
    url.pathname.startsWith(`${base.pathname}/chat/charts/static/`)
  ) {
    url.searchParams.set("api_token", apiToken);
  }
  return url.href;
}
