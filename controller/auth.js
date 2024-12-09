const User = require("../model/user.model.js");
const passport = require("passport");
var GoogleStrategy = require("passport-google-oauth20").Strategy;
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: String(process.env.CLIENTID),
//       clientSecret: String(process.env.CLIENT_SECRET),
//       callbackURL: "http://localhost:3000/auth/google/callback",
//     },
//     function (accessToken, refreshToken, profile, cb) {
//       User.findOrCreate({ googleId: profile.id }, function (err, user) {
//         return cb(err, user);
//       });
//     }
//   )
// );
const signUp = async (req, res) => {
  // passport.authenticate("google", { scope: ["profile"] });
};

const logIn = async (req, res) => {
  // passport.authenticate("google", { failureRedirect: "/login" }),
  //   function (req, res) {
  //     // Successful authentication, redirect home.
  //     res.redirect("/");
  //   };
};
const checkSession = async (req, res) => {};
const logOut = async (req, res) => {};
module.exports = { signUp, checkSession, logOut, logIn };
