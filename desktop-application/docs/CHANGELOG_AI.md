# AI changelog

- F1: Use Electron's assigned API URL for REST requests, the datasource WebSocket, and chat charts. Standalone Vite development uses the loopback fallback.
- F2: Enforce the Electron launch token, listener host, permitted origins, and canonical usernames. Hide the OpenAI key in settings responses and retain it on blank updates. Support a temporary data root for tests.
