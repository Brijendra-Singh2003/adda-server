import { EventEmitter } from "events";
import { Ws } from "../ws";
import World from "./World";

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
}

export default class GameManager {
  private eventBus: EventEmitter;
  private worlds: Map<string, World> = new Map();
  private updateInterval: NodeJS.Timeout;

  constructor(eventBus: EventEmitter) {
    this.eventBus = eventBus;

    // Listen for specific message types on the event bus
    this.eventBus.on("playerMovement", this.handlePlayerMovement.bind(this));
    this.eventBus.on(
      "playerDisconnected",
      this.handlePlayerDisconnect.bind(this)
    );

    this.eventBus.on(
      "enterRoom",
      this.hanldlePlayerEnterRoomForWorld.bind(this)
    );

    this.eventBus.on("messageInRoom", this.handleMessageInRoom.bind(this));
    this.eventBus.on("exitRoom", this.hanldlePlayerExitRoomForWorld.bind(this));

    this.updateInterval = setInterval(() => this.broadcastUpdates(), 1000 / 12);
  }

  private handleMessageInRoom(ws: Ws, data: { roomId: string; text: string }) {
    const worldId = ws.worldId;
    const world = this.worlds.get(worldId);
    console.log(world);
    world?.playerMessageInRoom(ws, data);
  }

  private hanldlePlayerEnterRoomForWorld(ws: Ws, data: { roomId: string }) {
    const worldId = ws.worldId;
    const world = this.worlds.get(worldId);
    world?.handleEnterinRoom(ws, data);
  }

  private hanldlePlayerExitRoomForWorld(ws: Ws, data: { roomId: string }) {
    const worldId = ws.worldId;
    const world = this.worlds.get(worldId);
    world?.handleExitinRoom(ws, data);
  }

  public onPlayerConnected(ws: Ws) {
    const worldId = ws.worldId;
    let world = this.worlds.get(worldId);

    if (!world) {
      world = new World();
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

    world.onPlayerMove(ws.playerId, movementData.x, movementData.y);
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
    this.worlds.forEach((world, name) => {
      world.broadCastUpdate();
    });
  }

  public destroy() {
    clearInterval(this.updateInterval);
  }
}
