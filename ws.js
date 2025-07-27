const ws = require("ws");

function createWSS(server) {
  const wss = new ws.Server({ server });
  const room = [];
  const MESSAGE_LIMIT = 10;
  let count = 1;
  let messageId = 4;
  const map = {
    table: new Set(),
    fountain: new Set(),
  };

  const clients = new Map();
  const room_wise_clients = {
    table: new Map(),
    fountain: new Map(),
  };
  const chats = {
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

  wss.on("connection", (socket) => {
    const id = count++;
    let myUsername;
    let myRoom;

    socket.on("message", (data, isBinary) => {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "init":
          myUsername = message.data.username;
          room.push({
            username: myUsername,
            posi: { x: 20, y: 20, vx: 0, vy: 0 },
          });
          break;

        case "move":
          for (const player of room) {
            if (player.username === myUsername) {
              player.posi = message.data.posi;
              break;
            }
          }
          break;

        case "enter":
          currRoom = message.data.room;
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

        case "exit":
          currRoom = message.data.room;
          console.log("exit from  in ", message);
          room_wise_clients[currRoom].delete(myUsername);
          map[currRoom].delete(socket);
          console.log(myUsername);
          console.log(
            "remaining user in that room ",
            room_wise_clients[currRoom].keys()
          );
          Array.from(room_wise_clients[currRoom].keys()).forEach((clientId) => {
            room_wise_clients[currRoom]
              .get(clientId)
              .send(JSON.stringify({ type: "exitRoom", data: myUsername }));
          });
          clients.delete(myUsername);

          break;

        case "messages":
          currRoom = message.data.room;

          console.log("chats", chats, currRoom);

          chats[currRoom].push({
            id: messageId++,
            sender: myUsername,
            text: message.data.text,
          });

          if (chats[currRoom].length > MESSAGE_LIMIT) {
            chats[currRoom].shift();
          }

          console.log("after ", chats[currRoom]);
          socket.send(
            JSON.stringify({ type: "messages", data: chats[currRoom] })
          );
          for (const x of map[currRoom]) {
            x.send(JSON.stringify({ type: "messages", data: chats[currRoom] }));
          }
          // wss.clients.forEach((client) => {
          //   client.send(
          //     JSON.stringify({ type: "messages", data: chats[currRoom] })
          //   );
          // });
          break;

        case "join":
          {
            const room = message.room;
            myRoom = room;
            console.log("enter in room", room);
            const users = Array.from(room_wise_clients[room].keys());
            console.log("users are", users);

            socket.send(
              JSON.stringify({
                type: "clients",
                data: Array.from(room_wise_clients[room].keys()) || [],
              })
            );
            room_wise_clients[room].set(myUsername, socket);
            console.log(room_wise_clients[room].keys());
          }
          break;

        case "offer":
          {
            const room = message.room;
            const receiver = room_wise_clients[room].get(message.receiverId);
            console.log(
              `recieving offer from ${myUsername} to ${message.receiverId}`
            );
            if (receiver) {
              receiver.send(
                JSON.stringify({
                  type: "offer",
                  data: message.data,
                  senderId: myUsername,
                })
              );
            } else {
              console.error(`Receiver ${receiver} not found`);
            }
          }
          break;

        case "answer": {
          const room = message.room;
          const receiver = room_wise_clients[room].get(message.receiverId);
          console.log(
            "answer recieve ",
            message.receiverId,
            " in the room ",
            room
          );
          if (receiver) {
            receiver.send(
              JSON.stringify({
                type: "answer",
                data: message.data,
                senderId: myUsername,
              })
            );
          } else {
            console.error(`Receiver ${message.receiverId} not found`);
          }
          break;
        }

        default: {
          const receiver = room_wise_clients[myRoom].get(message.receiverId);
          if (receiver) {
            receiver.send(
              JSON.stringify({
                type: message.type,
                data: message.data,
                senderId: myUsername,
              })
            );
          }

          break;
        }
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

      // room = room.filter((e) => (e.username !== myUsername));
      console.log(`device ${id} disconnected.`, room);

      for (const client of wss.clients) {
        if (client !== socket) {
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
      client.send(JSON.stringify({ type: "update", data: room }));
    }
  }, 100);
}

module.exports = { createWSS };
