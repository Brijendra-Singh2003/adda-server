// import mongoose from "mongoose";
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  googleId: {
    type: "string",
    required: true,
  },
  name: {
    type: "string",
    required: true,
  },
  email: {
    type: "string",
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
