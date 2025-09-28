import WebSocket from "ws";
import { Server } from "http";
import EventEmitter from "events";
import GameManager from "./game/gameManager";

export interface Wss extends WebSocket.Server {
  clients: Set<WebSocket>;
}

export interface Ws extends WebSocket {
  playerName: string;
  playerId: string;
  worldId: string;
}

export function createWSS(server: Server): void {
  const eventBus = new EventEmitter();
  const wss = new WebSocket.Server({ server });
  const gameManager = new GameManager(eventBus);

  wss.on("connection", (ws: Ws, req) => {
    const url = new URL(`http://localhost:3000${req.url}`);

    if (!url.searchParams.get("name") || !url.searchParams.get("id")) {
      console.error("invalid request.");
      ws.close();
      return;
    }

    ws.worldId = url.pathname.slice(1);
    ws.playerId = url.searchParams.get("id") as string;
    ws.playerName = url.searchParams.get("name") as string;

    ws.on("message", (message: string) => {
      const parsedMessage = JSON.parse(message);
      const { type, data } = parsedMessage;

      eventBus.emit(type, ws, data);
    });

    ws.on("close", () => {
      console.log(`User disconnected: ${ws.playerId}`);
      eventBus.emit("playerDisconnected", ws);
    });

    gameManager.onPlayerConnected(ws);
    console.log(`User connected: ${ws.playerId}`);
  });
}
