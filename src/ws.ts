import WebSocket from "ws";
import { Server } from "http";
import EventEmitter from "events";
import { GameManager } from "./game/gameManager";
import ChatManager from "./game/chatManager";

export interface Wss extends WebSocket.Server {
    clients: Set<WebSocket>;
}

export interface Ws extends WebSocket {
    playerName: string;
    playerId: string;
    roomId: string;
}

export function createWSS(server: Server): void {
  const wss = new WebSocket.Server({ server });
  const eventBus = new EventEmitter();

  const gameManager = new GameManager(wss, eventBus);
  const chatManager = new ChatManager(wss, eventBus);

  wss.on("connection", (ws: Ws, req) => {
    const url = new URL(`http://localhost:3000${req.url}`);
    ws.playerName = url.searchParams.get("name") ?? "Unknown";
    ws.playerId = url.searchParams.get("id") ?? Math.random().toString(36).substr(2, 9);
    ws.roomId = url.pathname.slice(1);

    console.log(`User connected: ${ws.playerId}`);

    gameManager.onPlayerConnected(ws);
    chatManager.onPlayerConnected(ws);

    ws.on('message', (message: string) => {
      const parsedMessage = JSON.parse(message);
      const { type, data } = parsedMessage;

      eventBus.emit(type, ws, data);
    });

    ws.on('close', () => {
      console.log(`User disconnected: ${ws.playerId}`);
      eventBus.emit('playerDisconnected', ws);
    });
  });
}