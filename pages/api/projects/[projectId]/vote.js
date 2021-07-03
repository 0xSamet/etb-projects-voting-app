import { setDefaultHeaders } from "../../../middleware";

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "POST":
      return res.json({ success: true });
    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
