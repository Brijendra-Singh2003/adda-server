import { asyncHandler } from "../lib/utils";
import World from "../model/world.model";

export const get_worlds = asyncHandler(async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "please login." });
    }

    const userId = req?.user?._id;
    if (!userId) {
        return res.status(400).json({ error: "user info is not available, login again" });
    }

    const worlds = await World.find({ owner: userId });

    res.json(worlds);
});

export const create_world = asyncHandler(async (req: any, res: any) => {
    const { name } = req.body;

    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "please login." });
    }

    const userId = String(req?.user?._id);
    if (!userId) {
        return res.status(400).json({ error: "user info is not available, login again" });
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
})

export const delete_world = asyncHandler(async (req: any, res: any) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Login required" });
    }

    const { worldId } = req.params;
    const world = await World.findById(worldId);
    if (!world) {
        return res.status(404).json({ error: "World not found" });
    }

    const isOwner = String(world.owner) === String(req.user._id);
    if (!isOwner) {
        return res.status(403).json({ error: "you are not the owner of this world" });
    }

    await World.findByIdAndDelete(worldId);

    return res.status(200).json({
        success: true,
        message: "world deleted succesfully !"
    });
})

module.exports = { get_worlds, create_world, delete_world };