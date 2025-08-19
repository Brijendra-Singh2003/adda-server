const express = require("express");
const {create_world, get_worlds, delete_world} = require("../controller/world");
const worldRouter = express.Router();

worldRouter.get("/", get_worlds);
worldRouter.post("/",create_world);
worldRouter.delete("/:worldId",delete_world);

module.exports = worldRouter;