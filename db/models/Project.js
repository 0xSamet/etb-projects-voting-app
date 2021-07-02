import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  start_date: String,
  end_date: String,
  sort_order: Number,
  participants: [
    {
      author: String,
      source: String,
      voteCount: Number,
    },
  ],
  alreadyVoted: [String],
});

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema, "projects");
