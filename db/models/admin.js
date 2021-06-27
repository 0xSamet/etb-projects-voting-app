import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

export default mongoose.models.Admin ||
  mongoose.model("Admin", adminSchema, "admins");
