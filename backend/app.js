import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'; // تأكد من وجود .js
import mainRoutes from './routes/main.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();

// الاتصال بقاعدة البيانات
connectDB();

// إعدادات CORS لحل مشكلة ERR_CONNECTION_REFUSED والمنفذ 5000
app.use(cors({
    origin: 'http://localhost:5173', // رابط Vite
    credentials: true
}));

app.use(express.json());

// ربط المسارات
app.use('/', mainRoutes);
app.use('/api', userRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});