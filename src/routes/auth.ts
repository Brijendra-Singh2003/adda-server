import express from "express";
import passport from "../configuration/passport";
import { checkSession, logout, login } from "../controller/auth";

const AuthRouter = express.Router();

AuthRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
AuthRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), login);
AuthRouter.get("/check-session", checkSession);
AuthRouter.get("/logout", logout);

export default AuthRouter;
