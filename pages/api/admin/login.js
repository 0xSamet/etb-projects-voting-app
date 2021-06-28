import { handler } from "../../../helpers";
import Joi from "joi";
import Admin from "../../../db/models/Admin";
import connectDb from "../../../db/connect";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const adminLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export default handler.post(async (req, res) => {
  return new Promise(async (resolve) => {
    let validateRequest;
    try {
      validateRequest = await adminLoginSchema.validateAsync(req.body);
    } catch (e) {
      res.status(422).json({
        message: e.details[0].message,
        path: e.details[0].path[0],
      });
      resolve();
    }

    await connectDb();

    const isUserNameExists = await Admin.findOne({
      username: validateRequest.username,
    });

    if (!isUserNameExists) {
      res.status(401).json({ message: "username or password is incorrect!" });
      resolve();
    }

    const isPasswordTrue = await bcrypt.compare(
      validateRequest.password,
      isUserNameExists.password
    );

    if (!isPasswordTrue) {
      res.status(401).json({ message: "username or password is incorrect!" });
      resolve();
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
    res.json({
      success: true,
      username: isUserNameExists.username,
    });
    resolve();
  });
});
