import express from "express";
import { create_world, get_worlds, delete_world } from "../controller/world";
const worldRouter = express.Router();

worldRouter.get("/", get_worlds);
worldRouter.post("/", create_world);
worldRouter.delete("/:worldId", delete_world);

export default worldRouter;