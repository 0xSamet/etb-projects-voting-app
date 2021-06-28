import { handler, authenticateAdmin } from "../../../helpers";
import Joi from "joi";
import Admin from "../../../db/models/Admin";
import connectDb from "../../../db/connect";
import bcrypt from "bcrypt";
import Project from "../../../db/models/Project";

const addProjectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required().allow(""),
  start_date: Joi.string().required(),
  end_date: Joi.string().required(),
  participants: Joi.array()
    .items(
      Joi.object({
        author: Joi.string().required(),
        source: Joi.string().required(),
      })
    )
    .required(),
});

export default authenticateAdmin(
  handler.post(async (req, res) => {
    return new Promise(async (resolve) => {
      let validateRequest;
      try {
        validateRequest = await addProjectSchema.validateAsync(req.body);
      } catch (e) {
        res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
        return resolve();
      }

      await connectDb();

      const createProject = await Project.create({
        name: validateRequest.name,
        description: validateRequest.description,
        start_date: validateRequest.start_date,
        end_date: validateRequest.end_date,
        participants: validateRequest.participants,
      });

      const projectCreated = await createProject.save();

      res.json({ success: true });
      resolve();
    });
  })
);
