import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
  name: String,
  description: String,
  start_date: String,
  end_date: String,
  sort_order: Number,
  proposals: [
    {
      text: String,
      voteCount: String,
    },
  ],
  alreadyVoted: [
    {
      wallet: String,
      tokenHave: String,
      vote_date: String,
      proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Poll.proposals",
      },
    },
  ],
});

export default mongoose.models.Poll ||
  mongoose.model("Poll", pollSchema, "polls");
