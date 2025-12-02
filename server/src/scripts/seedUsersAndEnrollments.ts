import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/user.model';
import Course from '../models/course.model';
import Enrollment from '../models/enrollment.model';
import Role from '../enums/user.enum';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roads-to-rome';

const mockUsers = [
  { email: 'student1@example.com', password: 'password123', role: Role.STUDENT },
  { email: 'student2@example.com', password: 'password123', role: Role.STUDENT },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for user/enrollment seeding');

    // Ensure there are courses to enroll in
    const courses = await Course.find().limit(10).exec();
    if (!courses.length) {
      console.warn('No courses found - run seed:courses first or create courses');
    }

    // Clear existing test users and enrollments created by this seed (match by email prefix)
    await Enrollment.deleteMany({});
    await User.deleteMany({ email: { $in: mockUsers.map(u => u.email) } });

    // Create users (note: password is plain here; the auth service normally hashes on create)
    // If the User model depends on hashing middleware, adapt accordingly.
    const createdUsers = await User.insertMany(
      mockUsers.map(u => ({ email: u.email, password: u.password, role: u.role }))
    );

    console.log(`Inserted ${createdUsers.length} users`);

    // Create enrollments linking each user to the first course (if exists)
    if (courses.length) {
      const enrollmentsToInsert: any[] = [];
      createdUsers.forEach((user, idx) => {
        const course = courses[idx % courses.length];
        enrollmentsToInsert.push({ studentId: user._id, courseId: course._id, status: 'enrolled' });
      });

      await Enrollment.insertMany(enrollmentsToInsert);
      console.log(`Inserted ${enrollmentsToInsert.length} enrollments`);
    }
  } catch (err) {
    console.error('Seed users/enrollments error', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

seed();
