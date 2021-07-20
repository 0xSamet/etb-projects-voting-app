import { authenticateAdmin, setDefaultHeaders } from "../../../middleware";
import Joi from "joi";

import connectDb from "../../../db/connect";

import Poll from "../../../db/models/Poll";

const addPollSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
  start_date: Joi.string().trim().required(),
  end_date: Joi.string().trim().required(),
  sort_order: Joi.number().default(0),
  proposals: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().trim().required(),
        voteCount: Joi.string().default("0"),
      })
    )
    .required(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "GET":
      await connectDb();

      const polls = await Poll.find({}).select({
        alreadyVoted: 0,
        __v: 0,
      });

      return res.json({ polls });

    case "POST":
      await authenticateAdmin(req, res);
      let validateRequest;
      try {
        validateRequest = await addPollSchema.validateAsync(req.body);
      } catch (e) {
        console.log(e);
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      await connectDb();

      const createPoll = await Poll.create({
        name: validateRequest.name,
        description: validateRequest.description,
        start_date: validateRequest.start_date,
        end_date: validateRequest.end_date,
        sort_order: validateRequest.sort_order,
        proposals: validateRequest.proposals,
      });

      const pollCreated = await createPoll.save();

      return res.json({ success: true });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
