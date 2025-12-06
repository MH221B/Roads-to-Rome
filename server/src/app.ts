import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.route';
import { adminRouter } from './routes/admin.route';
import { courseRouter } from './routes/course.route';
import { enrollmentRouter } from './routes/enrollment.route';
import { lessonRouter } from './routes/lesson.route';
import { quizRouter } from './routes/quiz.route';

const app = express();

// Middleware
// Ensure CLIENT_URL doesn't include a trailing slash which would
// prevent exact-origin comparisons (e.g. 'https://site/' !== 'https://site')
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const clientUrl = rawClientUrl.replace(/\/$/, '');

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 Day
    },
  })
);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/courses', courseRouter);
app.use('/api/quizzes', quizRouter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

export default app;
