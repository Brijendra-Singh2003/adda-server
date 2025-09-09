import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Ws, Wss } from '../ws';

interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface World {
    players: Record<string, Player>;
    pendingUpdates: Record<string, Player>;
    clients: Set<Ws>;
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
        this.eventBus.on('playerMovement', this.handlePlayerMovement.bind(this));
        this.eventBus.on('playerDisconnected', this.handlePlayerDisconnect.bind(this));

        // Start the game loop to send updates at a fixed rate (e.g., 24 times per second)
        this.updateInterval = setInterval(() => this.broadcastUpdates(), 1000 / 12);
    }

    public onPlayerConnected(ws: Ws) {
        const playerId = ws.playerId;
        const playerName = ws.playerName;
        const worldId = ws.worldId;

        let world = this.worlds.get(worldId);
        if (!world) {
            world = { players: {}, pendingUpdates: {}, clients: new Set() };
            this.worlds.set(worldId, world);
        }

        world.clients.add(ws);
        world.players[playerId] = {
            id: playerId,
            name: playerName,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
        };

        ws.send(JSON.stringify({ type: 'currentPlayers', data: Object.values(world.players) }));

        world.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(JSON.stringify({
                    type: 'playerConnect',
                    data: world.players[playerId]
                }));
            }
        });

    }

    public handlePlayerMovement(ws: Ws, movementData: { x: number; y: number }) {
        const playerId = ws.playerId;
        let world = this.worlds.get(ws.worldId);

        if (!world) {
            console.error("No world found with id", ws.worldId);
            return;
        }

        // Update the player's position in the main state
        if (world.players[playerId]) {
            world.players[playerId].x = movementData.x;
            world.players[playerId].y = movementData.y;

            // Add the updated player to the pending updates object
            world.pendingUpdates[playerId] = world.players[playerId];
        }
    }

    public handlePlayerDisconnect(ws: Ws) {
        const playerId = ws.playerId;
        const world = this.worlds.get(ws.worldId);

        if (!world) {
            console.error("No world found with id", ws.worldId);
            return;
        }
        
        // Remove from pending updates if a disconnect happens
        delete world.players[playerId];
        delete world.pendingUpdates[playerId];
        world.clients.delete(ws);

        // Tell clients to remove this player
        world.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'disconnect', data: playerId }));
            }
        });
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
        this.worlds.forEach((world,name)=>{
            const updates = Object.values(world.pendingUpdates);
            world.clients.forEach((client)=>{
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'playerUpdates', data: updates }));
                }
            })
            world.pendingUpdates = {};
        })
        
    }

    public destroy() {
        clearInterval(this.updateInterval);
    }
}
