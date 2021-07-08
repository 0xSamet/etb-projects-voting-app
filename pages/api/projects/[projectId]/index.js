import { authenticateAdmin, setDefaultHeaders } from "../../../../middleware";
import Joi from "joi";

import connectDb from "../../../../db/connect";

import Project from "../../../../db/models/Project";

const updateProjectSchema = Joi.object({
  name: Joi.string().required().trim(),
  short_description: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
  start_date: Joi.string().trim().required(),
  end_date: Joi.string().trim().required(),
  sort_order: Joi.number().default(0),
  participants: Joi.array()
    .items(
      Joi.object({
        _id: Joi.string().trim().required(),
        author: Joi.string().trim().required(),
        source: Joi.string().trim().required(),
        voteCount: Joi.number().default(0),
        newParticipant: Joi.boolean(),
        deleted: Joi.boolean(),
      })
    )
    .required(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "GET":
      if (!req.query.projectId) {
        return res.status(422).json({
          message: "Missing Query Params! (projectId)",
        });
      }
      await connectDb();

      const project = await Project.findOne({
        _id: req.query.projectId,
      }).select({
        alreadyVoted: 0,
        __v: 0,
      });

      if (!project) {
        return res.status(404).json({
          message: "Project Not Found!",
        });
      }
      return res.json({ project });
    case "PUT":
      await authenticateAdmin(req, res);
      if (!req.query.projectId) {
        return res.status(422).json({
          message: "Missing Query Params! (projectId)",
        });
      }
      let validateRequest;
      try {
        validateRequest = await updateProjectSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }
      await connectDb();

      const projectToUpdate = await Project.findOne({
        _id: req.query.projectId,
      });

      if (!projectToUpdate) {
        return res.status(404).json({
          message: "Project Not Found!",
        });
      }

      projectToUpdate.name = validateRequest.name;
      projectToUpdate.short_description = validateRequest.short_description;
      projectToUpdate.description = validateRequest.description;
      projectToUpdate.start_date = validateRequest.start_date;
      projectToUpdate.end_date = validateRequest.end_date;
      projectToUpdate.sort_order = validateRequest.sort_order;

      for (const participant of validateRequest.participants) {
        let participantInDb = projectToUpdate.participants.id(participant._id);

        if (participant.deleted) {
          const participantId = participant._id;

          projectToUpdate.participants = projectToUpdate.participants.filter(
            (p) => p._id != participantId
          );
          continue;
        }
        if (participantInDb && !participant.deleted) {
          participantInDb["author"] = participant.author;
          participantInDb["source"] = participant.source;
          continue;
        }
        if (participant.newParticipant) {
          projectToUpdate.participants.push({
            author: participant.author,
            source: participant.source,
            voteCount: participant.voteCount,
          });
        }
      }

      await projectToUpdate.save();

      return res.json({ project: projectToUpdate });

    case "DELETE":
      await authenticateAdmin(req, res);
      if (!req.query.projectId) {
        return res.status(422).json({
          message: "Missing Query Params! (projectId)",
        });
      }
      await connectDb();

      const projectDeleted = await Project.findOneAndDelete({
        _id: req.query.projectId,
      });

      if (!projectDeleted) {
        return res.status(404).json({
          message: "Project Not Found!",
        });
      }
      return res.json({ success: true });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
