import Course, { ICourse } from '../models/course.model';

interface ICourseService {
  listCourses(): Promise<any[]>;
}

const courseService: ICourseService = {
  async listCourses(): Promise<any[]> {
    // return all courses sorted by createdAt desc (lean returns plain objects)
    return (await Course.find().sort({ createdAt: -1 }).lean().exec()) as any[];
  },
};

export default courseService;
