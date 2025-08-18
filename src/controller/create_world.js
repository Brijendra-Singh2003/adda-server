const World = require("../model/world.model");
const create_world = async(req,res)=>{
    try{
        const {name} = req.body;
        console.log("name of world is ",name)
        if(!req.isAuthenticated()){
            return res.status(401).json({error:"plz login first"});
            
        }
        console.log("user is -->",String(req.user?._id));
        const userId = String(req?.user?._id);
        // const userId = "67542c64bd5d9821091e10df"; for testing in postman
        if(!userId){
            return res.status(400).json({error:"user info is not available, login again"});
            
        }
        const newWorld = new World({
            name: name || "world #1",
            owner:userId
        })
        const saveWorld = await newWorld.save();
        return res.status(200).json({
            message:"succesfully created world!",
            world: saveWorld,
        })

    }catch(err){
        console.log("error while creating the world ",err);
        return res.status(500).json({ 
            error: "Internal server error",
            details: err.message 
        });
    }
}

 const delete_world = async(req,res)=>{
    try{
        const { worldId } = req.params;
        if(!req.isAuthenticated()){
            return res.status(401).json({error:"plz login first"});   
        }
        const world = await World.findById(worldId);
        if (!world) {
            return res.status(404).json({ error: "World not found" });
        }
        const ownerId = world.owner;
        if(String(req.user._id) != String(ownerId)){
           return res.status(401).json({error:"you are not the owner of this world"});
        } 
        await World.findByIdAndDelete(worldId);
        return res.status(200).json({
            success:true,
            message:"world deleted succesfully !"
        })

    }catch(error){
        console.log("error while deleting the world ",err);
        return res.status(500).json({ 
            error: "Internal server error",
            details: err.message 
        });
    }
}

module.exports = { create_world, delete_world };