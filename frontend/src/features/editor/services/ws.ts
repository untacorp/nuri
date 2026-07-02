import { WS_URL } from '../../../config/env';

export const createWebSocketConnection = (onMessage: (data: any) => void) => {
  const ws = new WebSocket(WS_URL);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('WebSocket parsing error:', e);
    }
  };
  return ws;
};
