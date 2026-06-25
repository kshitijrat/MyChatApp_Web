import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { createRequire } from 'module';

dotenv.config();

const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccount.json');
// const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
//   ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
//   : require('./serviceAccount.json');

// Firebase Admin Init — PEHLE HONA CHAHIYE
initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'mychatapp-1c9a5.appspot.com'
});

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes — Firebase init ke BAAD import karo
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Server is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});