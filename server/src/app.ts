import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.route';
import { adminRouter } from './routes/admin.route';
import { instructorRouter } from './routes/instructor.route';
import { courseRouter } from './routes/course.route';
import { enrollmentRouter } from './routes/enrollment.route';
import { lessonRouter } from './routes/lesson.route';
import { quizRouter } from './routes/quiz.route';
import { paymentRouter } from './routes/payment.route';
import { upload } from './middlewares/upload.middleware';
import { uploadImageToSupabase } from './lib/supabaseClient';

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
app.use('/api/instructor', instructorRouter);
// Also expose plural form for backward compatibility and client expectations
app.use('/api/instructors', instructorRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/payments', paymentRouter);

// Nested lesson routes under courses
app.use('/api/courses/:courseId/lessons', lessonRouter);

// Upload endpoint for lesson files (videos, attachments)
app.post(
  '/api/uploads',
  upload.single('file'),
  async (req: express.Request, res: express.Response) => {
    try {
      const file = (req as express.Request & { file?: Express.Multer.File }).file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const timestamp = Date.now();
      const safeName = `${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`;

      try {
        // Determine bucket based on file type
        let bucket = 'lesson-attachments';
        if (file.mimetype.startsWith('video/')) {
          bucket = 'lesson-videos';
        } else if (file.mimetype.startsWith('image/')) {
          bucket = 'lesson-images';
        }

        const publicUrl = await uploadImageToSupabase(bucket, safeName, file.buffer, file.mimetype);

        res.status(200).json({ url: publicUrl });
      } catch (err) {
        res.status(500).json({ error: 'Failed to upload file', details: (err as Error).message });
      }
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

export default app;
