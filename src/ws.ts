import ws from "ws";
import { Server } from "http";
import { pub, sub } from "./configuration/redis";

// Define interfaces for type safety
interface Position {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Player {
  username: string;
  posi: Position;
}

interface ChatMessage {
  id: number;
  text: string;
  sender: string;
}

interface WebSocketMessage {
  type: string;
  data?: unknown;
  room?: RoomType;
  receiverId?: string;
}

interface InitMessage extends WebSocketMessage {
  type: "init";
  data: {
    username: string;
  };
}

interface MoveMessage extends WebSocketMessage {
  type: "move";
  data: {
    posi: Position;
  };
}

interface EnterMessage extends WebSocketMessage {
  type: "enter";
  data: {
    room: RoomType;
  };
}

interface ExitMessage extends WebSocketMessage {
  type: "exit";
  data: {
    room: RoomType;
  };
}

interface MessagesMessage extends WebSocketMessage {
  type: "messages";
  data: {
    room: RoomType;
    text: string;
  };
}

interface JoinMessage extends WebSocketMessage {
  type: "join";
  room: RoomType;
}

interface OfferMessage extends WebSocketMessage {
  type: "offer";
  room: RoomType;
  receiverId: string;
  data: unknown;
}

interface AnswerMessage extends WebSocketMessage {
  type: "answer";
  room: RoomType;
  receiverId: string;
  data: unknown;
}

type RoomType = "table" | "fountain";
type MessageType = InitMessage | MoveMessage | EnterMessage | ExitMessage | MessagesMessage | JoinMessage | OfferMessage | AnswerMessage | WebSocketMessage;

interface RedisMessage {
  room: RoomType;
  chats: ChatMessage[];
}

export function createWSS(server: Server): void {
  const wss = new ws.Server({ server });
  const room: Player[] = [];
  const MESSAGE_LIMIT = 10;
  let count = 1;
  let messageId = 4;
  
  const map: Record<RoomType, Set<ws.WebSocket>> = {
    table: new Set<ws.WebSocket>(),
    fountain: new Set<ws.WebSocket>(),
  };

  const clients = new Map<string, ws.WebSocket>();
  const room_wise_clients: Record<RoomType, Map<string, ws.WebSocket>> = {
    table: new Map(),
    fountain: new Map(),
  };
  
  const chats: Record<RoomType, ChatMessage[]> = {
    table: [
      { id: 1, text: "Hello! How can I help you today?", sender: "chintu" },
      { id: 2, text: "I have a question about my order", sender: "mintu" },
      {
        id: 3,
        text: "Sure, I'd be happy to help. What's your order number?",
        sender: "chintu",
      },
    ],
    fountain: [
      {
        id: 3,
        text: "fountain me apka swaget hai ",
        sender: "chintu",
      },
    ],
  };

  room.push({ username: "chintu", posi: { x: 50, y: 100, vx: 0, vy: 0 } });
  room.push({ username: "mintu", posi: { x: 150, y: 100, vx: 0, vy: 0 } });

  wss.on("connection", (socket: ws.WebSocket) => {
    const id = count++;
    let myUsername: string = "";
    let myRoom: RoomType = "table";
    let currRoom: RoomType = "table";
    
    sub.subscribe("chat_messages");

    sub.on("message", (channel: string, message: string) => {
      if (channel === "chat_messages") {
        const parsed: RedisMessage = JSON.parse(message);
        const { room: messageRoom, chats: messageChats } = parsed;

        for (const client of map[messageRoom]) {
          if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify({ type: "messages", data: messageChats }));
          }
        }
      }
    });

    socket.on("message", async (data: ws.RawData, isBinary: boolean) => {
      try {
        const message: MessageType = JSON.parse(data.toString());

        switch (message.type) {
          case "init": {
            const initMsg = message as InitMessage;
            myUsername = initMsg.data.username;
            room.push({
              username: myUsername,
              posi: { x: 20, y: 20, vx: 0, vy: 0 },
            });
            break;
          }

          case "move": {
            const moveMsg = message as MoveMessage;
            for (const player of room) {
              if (player.username === myUsername) {
                player.posi = moveMsg.data.posi;
                break;
              }
            }
            break;
          }

          case "enter": {
            const enterMsg = message as EnterMessage;
            currRoom = enterMsg.data.room;
            console.log("enter in ", message);
            const prevMessage = chats[currRoom];
            map[currRoom].add(socket);
            console.log(prevMessage);
            socket.send(
              JSON.stringify({
                type: "messages",
                data: chats[currRoom],
                notify: false,
              })
            );
            break;
          }

          case "exit": {
            const exitMsg = message as ExitMessage;
            currRoom = exitMsg.data.room;
            console.log("exit from in ", message);
            room_wise_clients[currRoom].delete(myUsername);
            map[currRoom].delete(socket);
            console.log(myUsername);
            console.log(
              "remaining user in that room ",
              room_wise_clients[currRoom].keys()
            );
            Array.from(room_wise_clients[currRoom].keys()).forEach((clientId: string) => {
              const client = room_wise_clients[currRoom].get(clientId);
              if (client && client.readyState === ws.OPEN) {
                client.send(JSON.stringify({ type: "exitRoom", data: myUsername }));
              }
            });
            clients.delete(myUsername);
            break;
          }

          case "messages": {
            const messagesMsg = message as MessagesMessage;
            currRoom = messagesMsg.data.room;
            
            console.log("chats", chats, currRoom);

            chats[currRoom].push({
              id: messageId++,
              sender: myUsername,
              text: messagesMsg.data.text,
            });

            if (chats[currRoom].length > MESSAGE_LIMIT) {
              chats[currRoom].shift();
            }

            console.log("after ", chats[currRoom]);
            socket.send(
              JSON.stringify({ type: "messages", data: chats[currRoom] })
            );

            await pub.publish(
              "chat_messages",
              JSON.stringify({
                room: currRoom,
                chats: chats[currRoom],
              })
            );
            break;
          }

          case "join": {
            const joinMsg = message as JoinMessage;
            const roomName = joinMsg.room;
            myRoom = roomName;
            console.log("enter in room", roomName);
            const users = Array.from(room_wise_clients[roomName].keys());
            console.log("users are", users);

            socket.send(
              JSON.stringify({
                type: "clients",
                data: Array.from(room_wise_clients[roomName].keys()) || [],
              })
            );
            room_wise_clients[roomName].set(myUsername, socket);
            console.log(room_wise_clients[roomName].keys());
            break;
          }

          case "offer": {
            const offerMsg = message as OfferMessage;
            const roomName = offerMsg.room;
            const receiver = room_wise_clients[roomName].get(offerMsg.receiverId);
            console.log(
              `receiving offer from ${myUsername} to ${offerMsg.receiverId}`
            );
            if (receiver && receiver.readyState === ws.OPEN) {
              receiver.send(
                JSON.stringify({
                  type: "offer",
                  data: offerMsg.data,
                  senderId: myUsername,
                })
              );
            } else {
              console.error(`Receiver ${offerMsg.receiverId} not found`);
            }
            break;
          }

          case "answer": {
            const answerMsg = message as AnswerMessage;
            const roomName = answerMsg.room;
            const receiver = room_wise_clients[roomName].get(answerMsg.receiverId);
            console.log(
              "answer receive ",
              answerMsg.receiverId,
              " in the room ",
              roomName
            );
            if (receiver && receiver.readyState === ws.OPEN) {
              receiver.send(
                JSON.stringify({
                  type: "answer",
                  data: answerMsg.data,
                  senderId: myUsername,
                })
              );
            } else {
              console.error(`Receiver ${answerMsg.receiverId} not found`);
            }
            break;
          }

          default: {
            if (message.receiverId) {
              const receiver = room_wise_clients[myRoom].get(message.receiverId);
              if (receiver && receiver.readyState === ws.OPEN) {
                receiver.send(
                  JSON.stringify({
                    type: message.type,
                    data: message.data,
                    senderId: myUsername,
                  })
                );
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    socket.on("close", () => {
      for (let i = 0; i < room.length; i++) {
        if (room[i].username === myUsername) {
          room[i] = room[room.length - 1];
          room.pop();
          break;
        }
      }
      clients.clear();

      console.log(`device ${id} disconnected.`, room);

      for (const client of wss.clients) {
        if (client !== socket && client.readyState === ws.OPEN) {
          client.send(
            JSON.stringify({
              type: "leave",
              data: { username: myUsername },
            })
          );
        }
      }
    });

    console.log(`device ${id} connected.`);
    socket.send(JSON.stringify({ type: "messages", data: chats }));
  });

  setInterval(() => {
    for (const client of wss.clients) {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ type: "update", data: room }));
      }
    }
  }, 100);
}