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

    console.log(`device ${id} connected.`, room);
    socket.send(JSON.stringify({ type: "messages", data: chats }));

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
            JSON.stringify({ type: "messages", data: chats[currRoom] })
          );
          break;
        case "exit":
          currRoom = message.data.room;
          console.log("exit from  in ", message);
          map[currRoom].delete(socket);
          // socket.send(
          //   JSON.stringify({ type: "messages", data: chats[currRoom] })
          // );
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
  });

  setInterval(() => {
    for (const client of wss.clients) {
      client.send(JSON.stringify({ type: "update", data: room }));
    }
  }, 100);
}

module.exports = { createWSS };
