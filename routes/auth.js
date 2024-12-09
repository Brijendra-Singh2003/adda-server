const express = require("express");
const { signUp, checkSession, logOut, logIn } = require("../controller/auth");
const AuthRouter = express.Router();

AuthRouter.get("/auth/google", signUp);
AuthRouter.get("/auth/google/callback", logIn);
AuthRouter.get("/", checkSession);
AuthRouter.get("/logout", logOut);

module.exports = AuthRouter; // Use CommonJS export
