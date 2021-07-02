import nextConnect from "next-connect";
import jwt from "jsonwebtoken";

// const handler = nextConnect({
//   onError(error, req, res) {
//     res.status(500).json({
//       message: `Sorry something Happened! - ${error.message}`,
//     });
//   },
//   onNoMatch(req, res) {
//     res.status(405).json({
//       message: `Method ${req.method} Not Allowed!`,
//     });
//   },
// });

async function authenticateAdmin(req, res) {
  return new Promise((resolve, reject) => {
    const token = req.cookies["token"] || "";
    jwt.verify(token, process.env.JWT_SECRET, async function (err, decoded) {
      if (!err && decoded) {
        resolve(decoded);
      } else {
        res.status(401).json({ message: "Not Authenticated!" });
        reject();
      }
    });
  });
}

async function setDefaultHeaders(req, res) {
  return new Promise((resolve, reject) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.BASE_URL);
    res.setHeader("Access-Control-Allow-Credentials", true);
    resolve();
  });
}

export { authenticateAdmin, setDefaultHeaders };
