import { authenticateAdmin, setDefaultHeaders } from "../../../../middleware";
import Joi, { types } from "joi";
import connectDb from "../../../../db/connect";
import Poll from "../../../../db/models/Poll";
import { Types } from "mongoose";

const updatePollSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
  start_date: Joi.string().trim().required(),
  end_date: Joi.string().trim().required(),
  sort_order: Joi.number().default(0),
  proposals: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().trim().required(),
        text: Joi.string().trim().required(),
        voteCount: Joi.string().default("0"),
        newProposal: Joi.boolean(),
        deleted: Joi.boolean(),
      })
    )
    .required(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "GET":
      if (!req.query.pollId) {
        return res.status(422).json({
          message: "Missing Query Params! (pollId)",
        });
      }

      if (!Types.ObjectId.isValid(req.query.pollId)) {
        return res.status(404).json({
          message: "Poll Not Found!",
        });
      }

      await connectDb();

      const poll = await Poll.findOne({
        _id: req.query.pollId,
      }).select({
        __v: 0,
      });

      if (!poll) {
        return res.status(404).json({
          message: "Poll Not Found!",
        });
      }
      return res.json({ poll });
    case "PUT":
      await authenticateAdmin(req, res);
      if (!req.query.pollId) {
        return res.status(422).json({
          message: "Missing Query Params! (pollId)",
        });
      }
      let validateRequest;
      try {
        validateRequest = await updatePollSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }
      await connectDb();

      const pollToUpdate = await Poll.findOne({
        _id: req.query.pollId,
      });

      if (!pollToUpdate) {
        return res.status(404).json({
          message: "Poll Not Found!",
        });
      }

      pollToUpdate.name = validateRequest.name;
      pollToUpdate.description = validateRequest.description;
      pollToUpdate.start_date = validateRequest.start_date;
      pollToUpdate.end_date = validateRequest.end_date;
      pollToUpdate.sort_order = validateRequest.sort_order;

      for (const proposal of validateRequest.proposals) {
        let proposalInDb = pollToUpdate.proposals.id(proposal._id);

        if (proposal.deleted) {
          const proposalId = proposal._id;

          pollToUpdate.proposals = pollToUpdate.proposals.filter(
            (p) => p._id != proposalId
          );
          continue;
        }
        if (proposalInDb && !proposal.deleted) {
          proposalInDb["text"] = proposal.text;
          continue;
        }
        if (proposal.newProposal) {
          pollToUpdate.proposals.push({
            text: proposal.text,
            voteCount: proposal.voteCount,
          });
        }
      }

      await pollToUpdate.save();

      return res.json({ poll: pollToUpdate });

    case "DELETE":
      await authenticateAdmin(req, res);
      if (!req.query.pollId) {
        return res.status(422).json({
          message: "Missing Query Params! (pollId)",
        });
      }
      await connectDb();

      const pollDeleted = await Poll.findOneAndDelete({
        _id: req.query.pollId,
      });

      if (!pollDeleted) {
        return res.status(404).json({
          message: "Poll Not Found!",
        });
      }
      return res.json({ success: true });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
