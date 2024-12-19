require("dotenv").config();
const http = require("http");
const User = require("./model/user.model.js");
const express = require("express");
const { createWSS } = require("./ws");
const path = require("path");
const AuthRouter = require("./routes/auth");
const connectDb = require("./configuration/db");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const sessionMiddleware = require("./controller/session");

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
};
const passport = require("passport");

//middleware
let name = "user";
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
app.use(cors(corsOptions));

var GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
          });
        }
        console.log("user is ", user);

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// google 0auth callBack
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect(process.env.FRONTEND_URL);
  }
);

app.get("/check-session", async (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: "unAutherized user" });
  }
});

app.get("/logOut", (req, res) => {
  req.logOut((err) => {
    if (err) {
      res.status(500).json({ error: "logout failed" });
    }
    res.redirect(process.env.FRONTEND_URL);
  });
});

app.use(express.json());

// Routes
// app.use("/api/auth", AuthRouter);
const HOST = process.env.HOST;

// to server client side build files
app.use(express.static(path.join(process.cwd(), "..", "client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "..", "client/dist/index.html"));
});

async function main() {
  await connectDb();

  const server = http.createServer(app);
  createWSS(server);

  server.listen(3000, () => {
    console.log("http://localhost:3000");
  });
}

main();
