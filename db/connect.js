import mongoose from "mongoose";

export default async () => {
  console.log(process.env.DB_URL);
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};
