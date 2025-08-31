
import passport from "passport";
import User from "../model/user.model";
import { Strategy } from "passport-google-oauth20";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

const googleStrategy = new Strategy(
  {
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
    callbackURL: BACKEND_URL + "/auth/google/callback",
  },
  async function (accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findOneAndUpdate({ googleId: profile.id }, {
        name: profile.displayName,
      }); // TODO: Remove update part when everyones names are updated.

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails ? profile.emails[0].value : "",
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
);

passport.use(googleStrategy);

passport.serializeUser((user: any, done) => {
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

export default passport;
