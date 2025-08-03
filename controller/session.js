// session.js
const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessionMiddleware = session({
  secret: "123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
  },
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL,
  }),
});

module.exports = sessionMiddleware;
