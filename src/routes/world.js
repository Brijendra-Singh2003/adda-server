const express = require("express");
const {create_world} = require("../controller/create_world");
const {delete_world} = require("../controller/create_world");
const worldRouter = express.Router();

worldRouter.post("/createWorld",create_world);
worldRouter.delete("/DeleteWorld/:worldId",delete_world);

module.exports = worldRouter;