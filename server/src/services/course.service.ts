import Course, { ICourse } from '../models/course.model';
import Lesson from '../models/lesson.model';
import Comment from '../models/comment.model';
import { User } from '../models/user.model';

interface ICourseService {
  listCourses(search?: string): Promise<any[]>;
  getCourseById(id: string): Promise<any | null>;
  createComment(courseId: string, rating: number, content: string, userId?: string, userName?: string): Promise<any>;
}

const courseService: ICourseService = {
  async listCourses(search?: string): Promise<any[]> {
    // If a search string is provided, use MongoDB text search across indexed fields
    if (search && search.trim().length > 0) {
      // use text score to sort by relevance, then fallback to createdAt
      const raw = (await Course.find(
        { $text: { $search: search } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .lean()
        .exec()) as any[];

      return raw.map((c) => {
        const { _id, courseId, ...rest } = c || {};
        return { id: courseId || String(_id), ...rest };
      });
    }

    // return all courses sorted by createdAt desc (lean returns plain objects)
    const raw = (await Course.find().sort({ createdAt: -1 }).lean().exec()) as any[];
    return raw.map((c) => {
      const { _id, courseId, ...rest } = c || {};
      return { id: courseId || String(_id), ...rest };
    });
  },

  async getCourseById(id: string): Promise<any | null> {
    // find course: prefer matching by Course.courseId string, fallback to _id
    let course = await Course.findOne({ courseId: id }).lean().exec();
    if (!course) {
      course = await Course.findById(id).lean().exec();
    }
    if (!course) return null;

    // lessons: match by course.courseId if present, otherwise by _id string
    const courseIdStr = course.courseId || (course._id ? String((course as any)._id) : id);
    const lessons = await Lesson.find({ course_id: courseIdStr }).sort({ order: 1 }).lean().exec();

    // comments: stored with courseId as course identifier string
    const commentsRaw = await Comment.find({ courseId: course.courseId || String((course as any)._id) })
      .populate({ path: 'userId', select: 'email role' })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const comments = (commentsRaw || []).map((c: any) => {
      const populatedUser = c.userId as any;
      return {
        id: c._id,
        course_id: String(c.courseId),
        user: populatedUser
          ? { id: populatedUser._id, name: populatedUser.email || c.userName || 'User', email: populatedUser.email || null }
          : { id: null, name: c.userName || 'Anonymous', email: null },
        rating: c.rating,
        content: c.content,
      };
    });

    // normalize instructor shape (frontend expects instructor.name/email)
    const instructor = typeof (course as any).instructor === 'object'
      ? (course as any).instructor
      : { name: (course as any).instructor || 'Unknown Instructor', email: null };

    return {
      id: course.courseId || String((course as any)._id),
      ...course,
      instructor,
      lessons,
      comments,
    };
  },

  async createComment(courseId: string, rating: number, content: string, userId?: string, userName?: string): Promise<any> {
    // Accept either courseId string or ObjectId
    const created = await Comment.create({
      courseId,
      userId: userId || undefined,
      userName: userName || undefined,
      rating,
      content,
    });

    // populate user if present and return normalized shape
    const pop = await Comment.findById(created._id).populate({ path: 'userId', select: 'email role' }).lean().exec();

    const populated = pop as any;
    const populatedUser = populated?.userId as any;

    return {
      id: populated?._id,
      course_id: String(populated?.courseId),
      user: populatedUser ? { id: populatedUser._id, name: populatedUser.email || populated.userName || 'User', email: populatedUser.email || null } : { id: null, name: populated?.userName || 'Anonymous', email: null },
      rating: populated?.rating,
      content: populated?.content,
    };
  },
};

export default courseService;
