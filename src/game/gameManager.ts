import { EventEmitter } from "events";
import WebSocket from "ws";
import { Ws, Wss } from "../ws";

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
}
class Room {
  public id: string;
  private players: Set<Ws>;
  constructor(roomId: string) {
    this.id = roomId;
    this.players = new Set();
  }

  public onPlayerEnter(newPlayer: Ws) {
    this.players.add(newPlayer);
  }

  public onMessage(sender: Ws, message: string) {
    this.players.forEach((player) => {
      if (player.OPEN && player != sender) {
        player.send(
          JSON.stringify({
            type: "chatMessage",
            data: {
              userName: sender.playerName,
              message: message,
            },
          })
        );
      }
    });
  }

  public onPlayerExit(player: Ws) {
    this.players.delete(player);
  }
}

class World {
  private worldId: string;
  private players: Record<string, Player>;
  private pendingUpdates: Record<string, Player>;
  private clients: Set<Ws>;
  private rooms: Map<string, Room>;
  constructor(id: string) {
    this.worldId = id;
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

export class GameManager {
  private wss: Wss;
  private eventBus: EventEmitter;
  private worlds: Map<string, World> = new Map();
  private pendingUpdates: Record<string, Player> = {};
  private updateInterval: NodeJS.Timeout;

  constructor(wss: Wss, eventBus: EventEmitter) {
    this.wss = wss;
    this.eventBus = eventBus;

    // Listen for specific message types on the event bus
    this.eventBus.on("playerMovement", this.handlePlayerMovement.bind(this));
    this.eventBus.on(
      "playerDisconnected",
      this.handlePlayerDisconnect.bind(this)
    );

    // Start the game loop to send updates at a fixed rate.
    this.updateInterval = setInterval(() => this.broadcastUpdates(), 1000 / 12);
  }

  public onPlayerConnected(ws: Ws) {
    const worldId = ws.worldId;
    let world = this.worlds.get(worldId);

    if (!world) {
      world = new World(worldId);
      this.worlds.set(worldId, world);
    }

    world.onPlayerEnter(ws);
  }

  public handlePlayerMovement(ws: Ws, movementData: { x: number; y: number }) {
    const playerId = ws.playerId;
    let world = this.worlds.get(ws.worldId);

    if (!world) {
      console.error("No world found with id", ws.worldId);
      return;
    }

    // Update the player's position in the main state
    world.onPlayerMove(ws.playerId, movementData.x, movementData.y);
    // if (world.players[playerId]) {
    //   world.players[playerId].x = movementData.x;
    //   world.players[playerId].y = movementData.y;

    //   // Add the updated player to the pending updates object
    //   world.pendingUpdates[playerId] = world.players[playerId];
    // }
  }

  public handlePlayerDisconnect(ws: Ws) {
    const playerId = ws.playerId;
    const world = this.worlds.get(ws.worldId);

    if (!world) {
      console.error("No world found with id", ws.worldId);
      return;
    }

    // Remove from pending updates if a disconnect happens
    world.removePlayer(ws);
  }

  // TODO: use world
  private broadcastUpdates() {
    // Check if there are any pending updates
    // const updates = Object.values(this.pendingUpdates);

    // if (updates.length > 0) {
    //     this.wss.clients.forEach(client => {
    //         if (client.readyState === WebSocket.OPEN) {
    //             client.send(JSON.stringify({ type: 'playerUpdates', data: updates }));
    //         }
    //     });
    //     // Clear the updates after broadcasting
    //     this.pendingUpdates = {};
    // }
    this.worlds.forEach((world, name) => {
      world.broadCastUpdate();
    });
    ``;
  }

  public destroy() {
    clearInterval(this.updateInterval);
  }
}
