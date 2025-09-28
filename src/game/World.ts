import { Ws } from "../ws";
import { Player } from "./gameManager";
import Room from "./Room";

export default class World {
  private players: Record<string, Player>;
  private pendingUpdates: Record<string, Player>;
  private clients: Set<Ws>;
  private rooms: Map<string, Room>;

  constructor() {
    this.players = {};
    this.pendingUpdates = {};
    this.clients = new Set();
    this.rooms = new Map();

    // temporary creating three room
    const room1 = new Room("1");
    const room2 = new Room("2");
    const room3 = new Room("3");
    this.rooms.set(room1.id, room1);
    this.rooms.set(room2.id, room2);
    this.rooms.set(room3.id, room3);
  }

  public handleEnterinRoom(ws: Ws, data: { roomId: string }) {
    const room = this.rooms.get(data.roomId);
    room?.onPlayerEnter(ws);
  }

  public handleExitinRoom(ws: Ws, data: { roomId: string }) {
    const room = this.rooms.get(data.roomId);
    room?.onPlayerExit(ws);
  }

  public playerMessageInRoom(ws: Ws, data: { roomId: string; text: string }) {
    const room = this.rooms.get(data.roomId);
    console.log(room);
    room?.onMessage(ws, data.text);
  }

  public onPlayerEnter(player: Ws) {
    this.clients.add(player);
    const newPlayer: Player = {
      id: player.playerId,
      name: player.playerName,
      x: 100,
      y: 100,
    };

    // notify this player
    this.players[player.playerId] = newPlayer;
    player.send(
      JSON.stringify({
        type: "currentPlayers",
        data: Object.values(this.players),
      })
    );

    // notify other players
    const message = JSON.stringify({
      type: "playerConnect",
      data: this.players[player.playerId],
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== player) {
        client.send(message);
      }
    });
  }

  public onPlayerMove(playerId: string, x: number, y: number) {
    this.players[playerId].x = x;
    this.players[playerId].y = y;

    this.pendingUpdates[playerId] = this.players[playerId];
  }

  public removePlayer(player: Ws) {
    const playerId = player.playerId;
    delete this.players[playerId];
    delete this.pendingUpdates[playerId];
    this.clients.delete(player);

    // also removing from the all of the different players that are present there
    const data = JSON.stringify({ type: "disconnect", data: playerId });
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  public broadCastUpdate() {
    const updates = JSON.stringify({
      type: "playerUpdates",
      data: Object.values(this.pendingUpdates),
    });
    this.clients.forEach((player) => {
      player.send(updates);
    });
    this.pendingUpdates = {};
  }
}
