
import "dotenv/config";
import cors from "cors";
import http from "http";
import express from "express";
import passport from "./configuration/passport";
import { createWSS } from "./ws";
import AuthRouter from "./routes/auth";
import worldRouter from "./routes/world";
import connectDb from "./configuration/db";
import sessionMiddleware from "./middlewares/session";
import { errorHandler } from "./middlewares/errorHandler";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 3000;
const app = express();

app.set("trust proxy", 1);

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

// Api Routes
app.use("/auth", AuthRouter);
app.use("/world",worldRouter)

app.get("/", (req, res) => {
  res.send("Hello!, from our base.");
});

// Error handler
app.use(errorHandler);

async function main() {
  await connectDb();

  const server = http.createServer(app);
  createWSS(server);

  server.listen(PORT, () => {
    console.log("http://localhost:" + PORT);
  });
}

main();
