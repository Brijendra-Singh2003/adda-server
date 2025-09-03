import { EventEmitter } from 'events';
import WebSocket from "ws";
import { Wss } from '../ws';

class ChatManager {
    private wss: Wss;
    private eventBus: EventEmitter;

    constructor(wss: Wss, eventBus: EventEmitter) {
        this.wss = wss;
        this.eventBus = eventBus;

        this.eventBus.on('chatMessage', this.handleChatMessage.bind(this));
    }

    onPlayerConnected(ws: WebSocket) {
        ws.send(JSON.stringify({
            type: 'chatMessage',
            data: {
                sender: 'Server',
                message: 'Welcome to the game! Start typing to chat.',
            }
        }));
    }

    handleChatMessage(ws: WebSocket, id: string, messageData: { message: string }) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'chatMessage', data: {
                        sender: id,
                        message: messageData.message
                    }
                }));
            }
        });
    }
}

export default ChatManager;
