import Joi from "joi";
import Admin from "../../../db/models/Admin";
import connectDb from "../../../db/connect";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { setDefaultHeaders } from "../../../middleware";

const adminLoginSchema = Joi.object({
  username: Joi.string().required().trim(),
  password: Joi.string().required().trim(),
});

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      let validateRequest;
      try {
        validateRequest = await adminLoginSchema.validateAsync(req.body);
      } catch (e) {
        return res.status(422).json({
          message: e.details[0].message,
          path: e.details[0].path[0],
        });
      }

      await connectDb();

      const isUserNameExists = await Admin.findOne({
        username: validateRequest.username,
      });

      if (!isUserNameExists) {
        return res
          .status(401)
          .json({ message: "username or password is incorrect!" });
      }

      const isPasswordTrue = await bcrypt.compare(
        validateRequest.password,
        isUserNameExists.password
      );

      if (!isPasswordTrue) {
        return res
          .status(401)
          .json({ message: "username or password is incorrect!" });
      }

      const token = jwt.sign(
        {
          sub: isUserNameExists._id,
          username: isUserNameExists.username,
          admin: true,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV !== "development",
          sameSite: "strict",
          maxAge: 60 * 60 * 24,
          path: "/",
        })
      );
      return res.json({
        success: true,
        username: isUserNameExists.username,
      });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
