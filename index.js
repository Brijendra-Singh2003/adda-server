require("dotenv").config();
const http = require("http");
const express = require("express");
const { createWSS } = require("./ws");
const path = require("path");

const app = express();
const HOST = process.env.HOST;

app.use(express.static(path.join(process.cwd(), "..", "client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "..", "client/dist/index.html"));
});

function main() {
  const server = http.createServer(app);
  createWSS(server);

  server.listen(3000, HOST, () => {
    console.log("http://localhost:3000");
  });
}

main();
