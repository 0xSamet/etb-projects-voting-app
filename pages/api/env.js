export default async (req, res) => {
  res.json({ env: process.env });
};
