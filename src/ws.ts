import WebSocket from "ws";
import { Server } from "http";
import EventEmitter from "events";
import { GameManager } from "./game/gameManager";
import ChatManager from "./game/chatManager";

export function createWSS(server: Server): void {
  const wss = new WebSocket.Server({ server });
  const eventBus = new EventEmitter();

  const gameManager = new GameManager(wss, eventBus);
  const chatManager = new ChatManager(wss, eventBus);

  wss.on("connection", (ws: WebSocket, req) => {
    const url = new URL(`http://localhost:3000${req.url}`);
    const name = url.searchParams.get("name") ?? "Unknown";
    const id = url.searchParams.get("id") ?? Math.random().toString(36).substr(2, 9);

    console.log(`User connected: ${id}`);

    gameManager.onPlayerConnected(ws, id, name);
    chatManager.onPlayerConnected(ws, id);

    ws.on('message', (message: string) => {
      const parsedMessage = JSON.parse(message);
      const { type, data } = parsedMessage;

      eventBus.emit(type, ws, id, data);
    });

    ws.on('close', () => {
      console.log(`User disconnected: ${id}`);
      eventBus.emit('playerDisconnected', ws);
    });
  });
}