// session.js
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { isProduction } = require("../utils/constants");

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

module.exports = sessionMiddleware;
