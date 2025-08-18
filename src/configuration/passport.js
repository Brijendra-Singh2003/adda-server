const passport = require("passport");
const User = require("../model/user.model");
const { Strategy } = require("passport-google-oauth20");
let count = 0;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const googleStrategy = new Strategy(
  {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: BACKEND_URL + "/auth/google/callback",
  },
  async function (accessToken, refreshToken, profile, done) {
    try {
      count++;
      console.log("finding user");
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          name: count,
          email: profile.emails[0].value,
        });
      }
      console.log("user is ", user);

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
);

passport.use(googleStrategy);

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user:", id);
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
