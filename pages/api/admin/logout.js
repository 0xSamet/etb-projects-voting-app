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
