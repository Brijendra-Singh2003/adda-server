const mongoose = require("mongoose");

const worldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,  // This will store the user's _id as a reference
    ref: "User",                          // Reference to the User model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,  // Automatically set to current date/time when created
  }
});

const World = mongoose.model("World", worldSchema);
module.exports = World;