import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Ws, Wss } from '../ws';

interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface Room {
    players: Record<string, Player>;
    pendingUpdates: Record<string, Player>;
    clients: Set<Ws>;
}

export class GameManager {
    private wss: Wss;
    private eventBus: EventEmitter;
    private rooms: Map<string, Room> = new Map();
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
        const roomId = ws.roomId;

        let room = this.rooms.get(roomId);
        if (!room) {
            room = { players: {}, pendingUpdates: {}, clients: new Set() };
            this.rooms.set(roomId, room);
        }

        room.clients.add(ws);
        room.players[playerId] = {
            id: playerId,
            name: playerName,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
        };

        ws.send(JSON.stringify({ type: 'currentPlayers', data: Object.values(room.players) }));

        room.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(JSON.stringify({
                    type: 'playerConnect',
                    data: room.players[playerId]
                }));
            }
        });

    }

    public handlePlayerMovement(ws: Ws, movementData: { x: number; y: number }) {
        const playerId = ws.playerId;
        let room = this.rooms.get(ws.roomId);

        if (!room) {
            console.error("No room found with id", ws.roomId);
            return;
        }

        // Update the player's position in the main state
        if (room.players[playerId]) {
            room.players[playerId].x = movementData.x;
            room.players[playerId].y = movementData.y;

            // Add the updated player to the pending updates object
            room.pendingUpdates[playerId] = room.players[playerId];
        }
    }

    public handlePlayerDisconnect(ws: Ws) {
        const playerId = ws.playerId;
        const room = this.rooms.get(ws.roomId);

        if (!room) {
            console.error("No room found with id", ws.roomId);
            return;
        }
        
        // Remove from pending updates if a disconnect happens
        delete room.players[playerId];
        delete room.pendingUpdates[playerId];
        room.clients.delete(ws);

        // Tell clients to remove this player
        room.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'disconnect', data: playerId }));
            }
        });
    }

    // TODO: use room
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
        this.rooms.forEach((room,name)=>{
            const updates = Object.values(room.pendingUpdates);
            room.clients.forEach((client)=>{
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'playerUpdates', data: updates }));
                }
            })
            room.pendingUpdates = {};
        })
        
    }

    public destroy() {
        clearInterval(this.updateInterval);
    }
}
