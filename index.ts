
import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/dummy', (req, res) => {
  res.json({ message: 'This is a dummy API endpoint' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  sequelize.authenticate()
    .then(() => console.log('Database connected'))
    .catch((err: any) => console.error('Unable to connect to the database:', err));
});