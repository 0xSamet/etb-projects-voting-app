import { handler } from "../../../helpers";
import Joi from "joi";
import Admin from "../../../db/models/Admin";
import connectDb from "../../../db/connect";
import bcrypt from "bcrypt";

const adminRegisterSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(6).required(),
  admin_register_password: Joi.string().required(),
});

export default handler.post(async (req, res) => {
  return new Promise(async (resolve) => {
    let validateRequest;
    try {
      validateRequest = await adminRegisterSchema.validateAsync(req.body);
    } catch (e) {
      res.status(422).json({
        message: e.details[0].message,
        path: e.details[0].path[0],
      });
      resolve();
    }

    if (
      validateRequest.admin_register_password !==
      process.env.ADMIN_REGISTER_PASSWORD
    ) {
      res.status(401).json({ message: "Unauthorized !" });
      resolve();
    }

    await connectDb();

    const isUserNameExists = await Admin.findOne({
      username: validateRequest.username,
    });

    if (isUserNameExists) {
      res.status(422).json({
        message: "Username Exists!",
        path: "username",
      });
      resolve();
    }

    const registerAdmin = await Admin.create({
      username: validateRequest.username,
      password: await bcrypt.hash(validateRequest.password, 8),
    });

    const adminCreated = await registerAdmin.save();

    res.json({ success: true, username: adminCreated.username });
    resolve();
  });
});
