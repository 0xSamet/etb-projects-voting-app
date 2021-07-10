import { authenticateAdmin, setDefaultHeaders } from "../../../middleware";
import Joi from "joi";

import connectDb from "../../../db/connect";

import Project from "../../../db/models/Project";

const addProjectSchema = Joi.object({
  name: Joi.string().required().trim(),
  short_description: Joi.string().required().allow(""),
  description: Joi.string().required().trim(),
  start_date: Joi.string().trim().required(),
  end_date: Joi.string().trim().required(),
  sort_order: Joi.number().default(0),
  participants: Joi.array()
    .items(
      Joi.object({
        author: Joi.string().trim().required(),
        source: Joi.string().trim().required(),
        voteCount: Joi.number().default(0),
      })
    )
    .required(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "GET":
      await connectDb();

      const projects = await Project.find({}).select({
        alreadyVoted: 0,
        __v: 0,
      });

      return res.json({ projects });

    case "POST":
      await authenticateAdmin(req, res);
      let validateRequest;
      try {
        validateRequest = await addProjectSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      await connectDb();

      const createProject = await Project.create({
        name: validateRequest.name,
        short_description: validateRequest.short_description,
        description: validateRequest.description,
        start_date: validateRequest.start_date,
        end_date: validateRequest.end_date,
        sort_order: validateRequest.sort_order,
        participants: validateRequest.participants,
      });

      const projectCreated = await createProject.save();

      return res.json({ success: true });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
