import nextConnect from "next-connect";
import jwt from "jsonwebtoken";

const handler = nextConnect({
  onError(error, req, res) {
    res.status(500).json({
      message: `Sorry something Happened! - ${error.message}`,
    });
  },
  onNoMatch(req, res) {
    res.status(405).json({
      message: `Method ${req.method} Not Allowed!`,
    });
  },
});

const authenticateAdmin = (fn) => async (req, res) => {
  return new Promise((resolve) => {
    const token = req.cookies["token"] || "";

    jwt.verify(token, process.env.JWT_SECRET, async function (err, decoded) {
      if (!err && decoded) {
        await fn(req, res);
        resolve();
      } else {
        res.status(401).json({ message: "Not Authenticated!" });
        resolve();
      }
    });
  });
};

export { handler, authenticateAdmin };
