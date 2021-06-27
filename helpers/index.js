import nextConnect from "next-connect";

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

export { handler };
