import { EventEmitter } from 'events';
import WebSocket from 'ws';

interface Player {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface Wss extends WebSocket.Server {
    clients: Set<WebSocket>;
}

export class GameManager {
    private wss: Wss;
    private eventBus: EventEmitter;
    private players: Record<string, Player> = {};
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

    onPlayerConnected(ws: WebSocket, id: string, name: string) {
        this.players[id] = {
            id: id,
            name: name,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
        };

        ws.send(JSON.stringify({ type: 'currentPlayers', data: this.players }));
        
        // Tell clients to remove this player
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN && client !== ws) {
                client.send(JSON.stringify({
                    type: 'playerConnect',
                    data: this.players[id]
                }));
            }
        });
    }

    handlePlayerMovement(ws: WebSocket, id: string, movementData: { x: number; y: number }) {
        // Update the player's position in the main state
        if (this.players[id]) {
            this.players[id].x = movementData.x;
            this.players[id].y = movementData.y;

            // Add the updated player to the pending updates object
            this.pendingUpdates[id] = this.players[id];
        }
    }

    handlePlayerDisconnect(ws: WebSocket, id: string) {
        const playerId = id;
        delete this.players[playerId];

        // Remove from pending updates if a disconnect happens
        delete this.pendingUpdates[playerId];

        // Tell clients to remove this player
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'disconnect', data: playerId }));
            }
        });
    }

    private broadcastUpdates() {
        // Check if there are any pending updates
        const updates = Object.values(this.pendingUpdates);
        if (updates.length > 0) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'playerUpdates', data: updates }));
                }
            });
            // Clear the updates after broadcasting
            this.pendingUpdates = {};
        }
    }

    public destroy() {
        clearInterval(this.updateInterval);
    }
}
