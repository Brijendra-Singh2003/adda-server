// session.js

import session from "express-session";
import MongoStore from "connect-mongo";
import { isProduction } from "../lib/constants";

const sessionMiddleware = session({
  secret: "123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction ? true : false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
  },
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL,
  }),
});

export default sessionMiddleware;
