const ws = require("ws");

function createWSS(server) {
  const wss = new ws.Server({ server });
  let count = 1;
  let room = [];

  room.push({ username: "chintu", posi: { x: 50, y: 100, vx: 0, vy: 0 } });
  room.push({ username: "mintu", posi: { x: 150, y: 100, vx: 0, vy: 0 } });


  wss.on("connection", (socket) => {
    const id = count++;
    let myUsername;

    console.log(`device ${id} connected.`, room);

    socket.on("message", (data, isBinary) => {
      const message = JSON.parse(data.toString());



      if (message.type === "init") {
        myUsername = message.data.username;
        room.push({ username: myUsername, x: 20, y: 20, vx: 0, vy: 0 });
      }
      else if (message.type === "move") {
        for (const player of room) {
          if (player.username === myUsername) {
            player.posi = message.data.posi;
            break;
          }
        }
        // room[myUsername] = message.data;
      }
    });

    socket.on("close", () => {

      room = room.filter((e)=> (e.username !== myUsername));
      console.log(`device ${id} disconnected.`, room);
    });
  });



  setInterval(() => {
    for (const client of wss.clients) {
      client.send(JSON.stringify({ type: "update", data: room }));
    }
  }, 100);
}

module.exports = { createWSS };
