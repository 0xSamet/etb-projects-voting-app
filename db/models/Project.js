import mongoose, { SchemaTypes } from "mongoose";

const projectSchema = new mongoose.Schema({
  name: String,
  short_description: String,
  description: String,
  start_date: String,
  end_date: String,
  sort_order: Number,
  participants: [
    {
      author: String,
      source: String,
      voteCount: String,
    },
  ],
  alreadyVoted: [
    {
      wallet: String,
      tokenHave: String,
      vote_date: String,
      participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project.participants",
      },
    },
  ],
});

export default mongoose.models.Project ||
  mongoose.model("Project", projectSchema, "projects");
