import Joi from "joi";
import Admin from "../../../db/models/Admin";
import connectDb from "../../../db/connect";
import bcrypt from "bcrypt";
import { setDefaultHeaders } from "../../../middleware";

const adminRegisterSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().min(6).trim().required(),
  admin_register_password: Joi.string().trim().required(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      let validateRequest;
      try {
        validateRequest = await adminRegisterSchema.validateAsync(req.body);
      } catch (e) {
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      if (
        validateRequest.admin_register_password !==
        process.env.ADMIN_REGISTER_PASSWORD
      ) {
        return res.status(401).json({ message: "Unauthorized !" });
      }

      await connectDb();

      const isUserNameExists = await Admin.findOne({
        username: validateRequest.username,
      });

      if (isUserNameExists) {
        return res.status(422).json({
          message: "Username Exists!",
          path: "username",
        });
      }

      const registerAdmin = await Admin.create({
        username: validateRequest.username,
        password: await bcrypt.hash(validateRequest.password, 8),
      });

      const adminCreated = await registerAdmin.save();

      return res.json({ success: true, username: adminCreated.username });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
