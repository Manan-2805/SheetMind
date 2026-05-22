class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Set<(data: any) => void> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private username: string = "default";
  private isConnecting: boolean = false;

  public connect(username: string = "default") {
    this.username = username;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    try {
      this.socket = new WebSocket(`ws://localhost:8000/api/ws/datasources?username=${encodeURIComponent(username)}`);

      this.socket.onopen = () => {
        this.isConnecting = false;
        console.log("[WebSocket] Connection established");
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[WebSocketEvent]", data.type || "unknown_event", data);
          this.listeners.forEach((listener) => {
            try {
              listener(data);
            } catch (err) {
              console.error("[WebSocket] Error in listener execution", err);
            }
          });
        } catch (err) {
          console.error("[WebSocket] Error parsing message data", err);
        }
      };

      this.socket.onclose = (event) => {
        this.isConnecting = false;
        this.socket = null;
        console.log("[WebSocket] Connection closed, scheduling reconnect in 3s...", event);
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        this.isConnecting = false;
        console.error("[WebSocket] Connection error", error);
      };
    } catch (err) {
      this.isConnecting = false;
      console.error("[WebSocket] Connect failed", err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect(this.username);
    }, 3000);
  }

  public addListener(listener: (data: any) => void) {
    this.listeners.add(listener);
    return () => this.removeListener(listener);
  }

  public removeListener(listener: (data: any) => void) {
    this.listeners.delete(listener);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
  }
}

export const websocketService = new WebSocketService();
