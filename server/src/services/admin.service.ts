import mongoose from 'mongoose';
import { User, IUser } from '../models/user.model';
import Course from '../models/course.model';
import Enrollment from '../models/enrollment.model';
import Role from '../enums/user.enum';
import { CourseStatus } from '../enums/course.enum';
import { validateCourseStatusTransition } from './course.service';

interface AdminData {
  message: string;
}

interface LeanUser extends Omit<IUser, 'comparePassword'> {
  _id: any;
  createdAt: Date;
  updatedAt: Date;
}

interface UserListItem {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  role: Role;
  locked: boolean;
  createdAt: Date;
}

interface PaginatedUsersResponse {
  data: UserListItem[];
  total: number;
  page: number;
  limit: number;
}

interface CourseListItem {
  id: string;
  title: string;
  status: CourseStatus;
  category?: string;
  instructor?: string | null;
  createdAt: Date;
}

interface PaginatedCoursesResponse {
  data: CourseListItem[];
  total: number;
  page: number;
  limit: number;
}

interface IAdminService {
  getAdminData(): Promise<AdminData>;
  getCurrentUser(userId: string): Promise<UserListItem>;
  getAllUsers(page?: number, limit?: number): Promise<PaginatedUsersResponse>;
  getUsersByRole(role: Role, page?: number, limit?: number): Promise<PaginatedUsersResponse>;
  searchUsers(query: string, page?: number, limit?: number): Promise<PaginatedUsersResponse>;
  updateUserRole(userId: string, role: Role): Promise<UserListItem>;
  toggleUserLocked(userId: string, locked: boolean): Promise<UserListItem>;
  getCoursesByStatus(status: CourseStatus, page?: number, limit?: number): Promise<PaginatedCoursesResponse>;
  updateCourseStatus(
    courseId: string,
    status: CourseStatus,
    reviewNote?: string | null,
    reviewerId?: string
  ): Promise<CourseListItem & { reviewNote?: string | null; reviewedBy?: string | null; reviewedAt?: Date | null }>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    usersByRole: Record<string, number>;
  }>;
}

const adminService: IAdminService = {
  async getAdminData(): Promise<AdminData> {
    return { message: 'Admin data retrieved successfully.' };
  },

  async getCurrentUser(userId: string): Promise<UserListItem> {
    const user = (await User.findById(userId, '-password').lean().exec()) as LeanUser | null;
    if (!user) throw new Error('User not found');
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      locked: user.locked || false,
      createdAt: user.createdAt,
    };
  },

  async getAllUsers(page: number = 1, limit: number = 10): Promise<PaginatedUsersResponse> {
    const paginateOptions: any = {
      page,
      limit,
      lean: true,
      select: '-password',
      sort: { createdAt: -1 },
      customLabels: {
        totalDocs: 'total',
        docs: 'data',
        page: 'page',
        limit: 'limit',
      },
    };

    const result: any = await (User as any).paginate({}, paginateOptions);

    const data = (result.data || []).map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      locked: user.locked || false,
      createdAt: user.createdAt,
    }));

    return { data, total: result.total, page: result.page, limit: result.limit };
  },

  async getUsersByRole(
    role: Role,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedUsersResponse> {
    const paginateOptions: any = {
      page,
      limit,
      lean: true,
      select: '-password',
      sort: { createdAt: -1 },
      customLabels: {
        totalDocs: 'total',
        docs: 'data',
        page: 'page',
        limit: 'limit',
      },
    };

    const result: any = await (User as any).paginate({ role }, paginateOptions);

    const data = (result.data || []).map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      locked: user.locked || false,
      createdAt: user.createdAt,
    }));

    return { data, total: result.total, page: result.page, limit: result.limit };
  },

  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedUsersResponse> {
    // Trim and normalize the query
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return this.getAllUsers(page, limit);
    }

    const paginateOptions: any = {
      page,
      limit,
      lean: true,
      select: '-password',
      sort: { score: { $meta: 'textScore' }, createdAt: -1 },
      customLabels: {
        totalDocs: 'total',
        docs: 'data',
        page: 'page',
        limit: 'limit',
      },
    };

    try {
      // Try full-text search first (text index exists)
      const result: any = await (User as any).paginate(
        {
          $text: { $search: normalizedQuery },
        },
        {
          ...paginateOptions,
          select: { '-password': 0, score: { $meta: 'textScore' } },
        }
      );

      const data = (result.data || []).map((user: any) => ({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        locked: user.locked || false,
        createdAt: user.createdAt,
      }));

      return { data, total: result.total, page: result.page, limit: result.limit };
    } catch (error) {
      // Fallback to regex-based search if text index is not available
      const searchRegex = new RegExp(normalizedQuery, 'i');
      const fallbackOptions: any = {
        page,
        limit,
        lean: true,
        select: '-password',
        sort: { createdAt: -1 },
        customLabels: {
          totalDocs: 'total',
          docs: 'data',
          page: 'page',
          limit: 'limit',
        },
      };

      const result: any = await (User as any).paginate(
        {
          $or: [{ email: searchRegex }, { username: searchRegex }, { fullName: searchRegex }],
        },
        fallbackOptions
      );

      const data = (result.data || []).map((user: any) => ({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        locked: user.locked || false,
        createdAt: user.createdAt,
      }));

      return { data, total: result.total, page: result.page, limit: result.limit };
    }
  },

  async updateUserRole(userId: string, role: Role): Promise<UserListItem> {
    const user = (await User.findByIdAndUpdate(userId, { role }, { new: true, select: '-password' })
      .lean()
      .exec()) as LeanUser | null;
    if (!user) throw new Error('User not found');
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      locked: user.locked || false,
      createdAt: user.createdAt,
    };
  },

  async toggleUserLocked(userId: string, locked: boolean): Promise<UserListItem> {
    const user = (await User.findByIdAndUpdate(
      userId,
      { locked },
      { new: true, select: '-password' }
    )
      .lean()
      .exec()) as LeanUser | null;
    if (!user) throw new Error('User not found');
    return {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      locked: user.locked || false,
      createdAt: user.createdAt,
    };
  },

  async getCoursesByStatus(
    status: CourseStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedCoursesResponse> {
    const paginateOptions: any = {
      page,
      limit,
      lean: true,
      sort: { createdAt: -1 },
      customLabels: {
        totalDocs: 'total',
        docs: 'data',
        page: 'page',
        limit: 'limit',
      },
    };

    const result: any = await (Course as any).paginate({ status }, paginateOptions);

    const data = (result.data || []).map((course: any) => ({
      id: course._id.toString(),
      title: course.title,
      status: course.status,
      category: course.category,
      instructor: course.instructor ? course.instructor.toString() : null,
      createdAt: course.createdAt,
    }));

    return { data, total: result.total, page: result.page, limit: result.limit };
  },

  async updateCourseStatus(
    courseId: string,
    status: CourseStatus,
    reviewNote?: string | null,
    reviewerId?: string
  ): Promise<CourseListItem & { reviewNote?: string | null; reviewedBy?: string | null; reviewedAt?: Date | null }> {
    const existing = await Course.findById(courseId).exec();
    if (!existing) throw new Error('Course not found');

    if (!Object.values(CourseStatus).includes(status)) {
      throw new Error('Invalid course status');
    }

    if (!validateCourseStatusTransition(existing.status as CourseStatus, status)) {
      throw new Error(`Invalid course status transition: ${existing.status} -> ${status}`);
    }

    const reviewerToStore =
      reviewerId && mongoose.Types.ObjectId.isValid(reviewerId)
        ? new mongoose.Types.ObjectId(reviewerId)
        : null;

    const updated = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: {
          status,
          reviewNote: typeof reviewNote === 'string' ? reviewNote : null,
          reviewedBy: reviewerToStore,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    )
      .lean()
      .exec() as any;

    if (!updated) throw new Error('Failed to update course');

    return {
      id: updated._id.toString(),
      title: updated.title,
      status: updated.status,
      category: updated.category,
      instructor: updated.instructor ? updated.instructor.toString() : null,
      createdAt: updated.createdAt,
      reviewNote: updated.reviewNote ?? null,
      reviewedBy: updated.reviewedBy ? updated.reviewedBy.toString() : null,
      reviewedAt: updated.reviewedAt ?? null,
    };
  },

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    usersByRole: Record<string, number>;
  }> {
    const [totalUsers, totalCourses, totalEnrollments, usersByRoleAgg] = await Promise.all([
      User.countDocuments().exec(),
      Course.countDocuments().exec(),
      Enrollment.countDocuments().exec(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]).exec(),
    ]);

    const usersByRole = (usersByRoleAgg || []).reduce((acc: Record<string, number>, row: any) => {
      acc[row._id] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return { totalUsers, totalCourses, totalEnrollments, usersByRole };
  },
};

export default adminService;
