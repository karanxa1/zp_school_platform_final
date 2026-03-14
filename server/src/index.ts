import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import staffRoutes from './routes/staff';
import academicsRoutes from './routes/academics';
import attendanceRoutes from './routes/attendance';
import feesRoutes from './routes/fees';
import examsRoutes from './routes/exams';
import homeworkRoutes from './routes/homework';
import libraryRoutes from './routes/library';
import transportRoutes from './routes/transport';
import hostelRoutes from './routes/hostel';
import inventoryRoutes from './routes/inventory';
import communicationRoutes from './routes/communication';
import complaintsRoutes from './routes/complaints';
import settingsRoutes from './routes/settings';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/academics', academicsRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/fees', feesRoutes);
app.use('/api/v1/exams', examsRoutes);
app.use('/api/v1/homework', homeworkRoutes);
app.use('/api/v1/library', libraryRoutes);
app.use('/api/v1/transport', transportRoutes);
app.use('/api/v1/hostel', hostelRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/communication', communicationRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/settings', settingsRoutes);

app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() }, message: '' });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

export default app;
