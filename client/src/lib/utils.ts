import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Course } from '@/services/courseService';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeJwtPayload(token: string | null): any | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

/**
 * Extracts unique tags from an array of courses and returns them sorted
 */
export function extractTagsFromCourses(courses: Course[]): string[] {
  const uniqueTags = new Set<string>();
  courses.forEach((course) => {
    course.tags.forEach((tag) => uniqueTags.add(tag));
  });
  return Array.from(uniqueTags).sort();
}
