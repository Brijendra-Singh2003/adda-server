// session.js
const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessionMiddleware = session({
  secret: "123",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "none",
    secure: true,
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
  store: MongoStore.create({
    mongoUrl: process.env.DATABASE_URL,
  }),
});

module.exports = sessionMiddleware;
