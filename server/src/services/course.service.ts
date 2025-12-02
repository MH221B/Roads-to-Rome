import Course, { ICourse } from '../models/course.model';

interface ICourseService {
  listCourses(search?: string): Promise<any[]>;
}

const courseService: ICourseService = {
  async listCourses(search?: string): Promise<any[]> {
    // If a search string is provided, use MongoDB text search across indexed fields
    if (search && search.trim().length > 0) {
      // use text score to sort by relevance, then fallback to createdAt
      return (await Course.find(
        { $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .lean()
        .exec()) as any[];
    }

    // return all courses sorted by createdAt desc (lean returns plain objects)
    return (await Course.find().sort({ createdAt: -1 }).lean().exec()) as any[];
  },
};

export default courseService;
