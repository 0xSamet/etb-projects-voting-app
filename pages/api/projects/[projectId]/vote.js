import Project from "../../../../db/models/Project";
import { setDefaultHeaders } from "../../../../middleware";
import connectDb from "../../../../db/connect";
import Joi from "joi";

const voteProjectSchema = Joi.object({
  participantId: Joi.string().required().trim(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      if (!req.query.projectId) {
        return res.status(422).json({
          message: "Missing Query Params! (projectId)",
        });
      }

      let validateRequest;
      try {
        validateRequest = await voteProjectSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      await connectDb();

      const projectToVote = await Project.findOne({
        _id: req.query.projectId,
      }).select({
        __v: 0,
      });

      if (!projectToVote) {
        return res.status(404).json({
          message: "Project Not Found!",
        });
      }

      let participantInDb = projectToVote.participants.id(
        validateRequest.participantId
      );

      if (!participantInDb) {
        return res.status(404).json({
          message: "Participant Not Found!",
        });
      }

      participantInDb.voteCount = participantInDb.voteCount + 1;

      await projectToVote.save();

      return res.json({ success: true });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
