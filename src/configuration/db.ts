
import mongoose from "mongoose";

const dbUrl = String(process.env.DATABASE_URL);

const connectDb = async (): Promise<void> => {
  console.log("connecting to db /...");
  console.log(dbUrl);
  try {
    await mongoose.connect(dbUrl);
  } catch (error) {
    console.log("error whike connecting to the database", error);
    process.exit(1);
  }
  console.log("Database connected ✌");
};

export default connectDb;
