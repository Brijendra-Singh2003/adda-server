const ws = require("ws");

function createWSS(server) {
  const wss = new ws.Server({ server });

  let count = 1;
  const devices = [];

  wss.on("connection", (socket) => {
    const id = count++;
    devices.push(id);
    console.log(`device ${id} connected.`, devices);

    socket.send(JSON.stringify({ id }));

    devices.forEach((device) => {
      if (device !== id) socket.send(JSON.stringify({ connection: device }));
    });

    wss.clients.forEach((client) => {
      if (client !== socket) client.send(JSON.stringify({ connection: id }));
    });

    socket.on("message", (data, isBinary) => {
      wss.clients.forEach((client) => {
        if (client !== socket) {
          client.send(data, { binary: isBinary });
        }
      });

      // const message = JSON.parse(data.toString());
      // console.log("Received message: ", data.toString());
    });

    socket.on("close", () => {
      for (let i = 0; i < devices.length; i++) {
        if (devices[i] === id) {
          devices[i] = devices[devices.length - 1];
          devices.pop();
          break;
        }
      }

      console.log(`device ${id} disconnected.`, devices);

      wss.clients.forEach((client) => {
        if (client !== socket) {
          client.send(JSON.stringify({ close: id }));
        }
      });
    });
  });
}

module.exports = { createWSS };
