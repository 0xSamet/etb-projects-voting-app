import { authenticateAdmin, setDefaultHeaders } from "../../../middleware";

export default async (req, res) => {
  await setDefaultHeaders(req, res);
  switch (req.method) {
    case "GET":
      const decodedToken = await authenticateAdmin(req, res);

      return res.json({ success: true, username: decodedToken.username });

    default:
      return res.status(405).json({
        message: `Method ${req.method} Not Allowed!`,
      });
  }
};
