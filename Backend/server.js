import app from "./src/app.js";
import'dotenv/config';
import connectDB from "./src/config/db.js";

const port = process.env.PORT || 3123;
connectDB();

app.listen(port, () => {
  console.log(`Server is running on Port: ${port}`);
})
