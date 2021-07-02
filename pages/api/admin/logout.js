import Joi from "joi";
import Admin from "../../../db/models/Admin";
import connectDb from "../../../db/connect";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { setDefaultHeaders } from "../../../middleware";

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("token", "", {
          maxAge: -1,
          path: "/",
        })
      );
      return res.json({
        success: true,
      });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
