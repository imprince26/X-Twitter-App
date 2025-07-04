import express from 'express';
import user from './routes/user';

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/user', user);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});