import express from 'express';
// import user from './routes/user';
import { connectDB } from './config/db';
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();
// app.use('/user', user);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});