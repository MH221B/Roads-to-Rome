import { User, IUser } from '../models/user.model';
import Role from '../enums/user.enum';

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

interface IAdminService {
  getAdminData(): Promise<AdminData>;
  getCurrentUser(userId: string): Promise<UserListItem>;
  getAllUsers(page?: number, limit?: number): Promise<PaginatedUsersResponse>;
  getUsersByRole(role: Role, page?: number, limit?: number): Promise<PaginatedUsersResponse>;
  searchUsers(query: string, page?: number, limit?: number): Promise<PaginatedUsersResponse>;
  updateUserRole(userId: string, role: Role): Promise<UserListItem>;
  toggleUserLocked(userId: string, locked: boolean): Promise<UserListItem>;
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
};

export default adminService;
