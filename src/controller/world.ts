import { RequestHandler } from "express";
import { HTTPError } from "../middlewares/errorHandler";
import World from "../model/world.model";
import { User } from "../types/user";

export const get_worlds: RequestHandler = async (req, res) => {
    if (!req.isAuthenticated()) {
        throw new HTTPError(401, "Please login.");
    }

    const userId = (req.user as User)?._id;
    if (!userId) {
        throw new HTTPError(400, "user info is not available, login again");
    }

    const worlds = await World.find({ owner: userId });

    res.json(worlds);
};

export const create_world: RequestHandler = async (req, res) => {
    const { name } = req.body;

    if (!req.isAuthenticated()) {
        throw new HTTPError(401, "Please login.")
    }
    
    const userId = String((req?.user as User)?._id);
    if (!userId) {
        throw new HTTPError(400, "user info is not available, login again")
    }

    const newWorld = new World({
        name: name || "world #1",
        owner: userId
    });

    const saveWorld = await newWorld.save();

    return res.status(200).json({
        message: "succesfully created world!",
        world: saveWorld,
    });
};

export const delete_world: RequestHandler = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Login required" });
    }

    const { worldId } = req.params;
    const world = await World.findById(worldId);
    if (!world) {
        return res.status(404).json({ error: "World not found" });
    }

    const isOwner = String(world.owner) === String((req.user as User)._id);
    if (!isOwner) {
        return res.status(403).json({ error: "you are not the owner of this world" });
    }

    await World.findByIdAndDelete(worldId);

    return res.status(200).json({
        success: true,
        message: "world deleted succesfully !"
    });
};
