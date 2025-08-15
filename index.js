require("dotenv").config();
const cors = require("cors");
const http = require("http");
const express = require("express");
const passport = require("./configuration/passport");

const { createWSS } = require("./ws");
const AuthRouter = require("./routes/auth");
const connectDb = require("./configuration/db");
const sessionMiddleware = require("./controller/session");


const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 3000;
const app = express();

const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};


//middleware
app.use(cors(corsOptions));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());


// Routes
app.use("/auth", AuthRouter);


async function main() {
  await connectDb();

  const server = http.createServer(app);
  createWSS(server);

  server.listen(PORT, () => {
    console.log("http://localhost:" + PORT);
  });
}

main();
