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
  origin: "http://localhost:5173",
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
  // console.log("start", user.id);
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    // console.log("call des");
    const user = await User.findById(id);
    // console.log(user);
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
    // console.log("User authenticated:", req.user);
    name = req.user;
    res.redirect("http://localhost:5173");
  }
);

app.get("/check-session", async (req, res) => {
  // console.log("call check dsession");
  // console.log(req.user);
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
    res.redirect("http://localhost:5173");
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
  const server = http.createServer(app);
  console.log("n:", name);
  createWSS(server, name);
  await connectDb();

  server.listen(3000, () => {
    console.log("http://localhost:3000");
  });
}

main();
