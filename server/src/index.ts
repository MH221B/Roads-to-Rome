import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import app from "./app";

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/roads-to-rome";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });