import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/course.model';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roads-to-rome';

const mockCourses = [
  {
    title: 'Modern React Patterns',
    thumbnail: 'https://picsum.photos/seed/modern-react-patterns/640/360',
    category: 'Web Development',
    tags: ['react', 'components', 'performance'],
    // no instructor id available in seed; leave as null
    shortDescription:
      'Explore advanced React patterns and hooks to build scalable, maintainable applications.',
    difficulty: 'Intermediate',
  },
  {
    title: 'TypeScript Deep Dive',
    thumbnail: 'https://picsum.photos/seed/typescript-deep-dive/640/360',
    category: 'Programming',
    tags: ['typescript', 'nodejs'],
    // no instructor id available in seed; leave as null
    shortDescription: 'Master TypeScript features and typing strategies for real-world codebases.',
    difficulty: 'Advanced',
  },
  {
    title: 'Design Systems in Practice',
    thumbnail: 'https://picsum.photos/seed/design-systems/640/360',
    category: 'UI/UX',
    tags: ['design', 'components'],
    // no instructor id available in seed; leave as null
    shortDescription:
      'Learn how to create and maintain a robust design system that teams can trust.',
    difficulty: 'Beginner',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding');
    // clear existing courses (optional)
    await Course.deleteMany({});
    await Course.insertMany(mockCourses);
    console.log('Inserted mock courses');
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

seed();
