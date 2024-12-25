const express = require("express");
const passport = require("../configuration/passport");
const { checkSession, logOut, logIn } = require("../controller/auth");

const AuthRouter = express.Router();

AuthRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
AuthRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), logIn);
AuthRouter.get("/check-session", checkSession);
AuthRouter.get("/logout", logOut);

module.exports = AuthRouter;
