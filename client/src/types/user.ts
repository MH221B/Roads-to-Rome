export type UserRole = 'admin' | 'student' | 'instructor';

export const UserRoles = {
  ADMIN: 'admin' as const,
  STUDENT: 'student' as const,
  INSTRUCTOR: 'instructor' as const,
};

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  locked: boolean;
  budget?: number;
  createdAt: string;
}
