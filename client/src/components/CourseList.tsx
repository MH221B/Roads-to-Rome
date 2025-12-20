import HeaderComponent from './HeaderComponent';
import CourseCard from './CourseCard';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CiCircleRemove } from 'react-icons/ci';
import { FaSearch } from 'react-icons/fa';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import type { Course as CourseType } from '@/services/courseService';
import { getCourses } from '@/services/courseService';

type Course = Omit<CourseType, 'difficulty'> & { difficulty?: string | null };

export default function CourseList() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Fetch all available categories on component mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const allCourses = await getCourses(0, 1000);
        const categories = Array.from(
          new Set(
            allCourses
              .map((c) => c.category)
              .filter((c): c is string => c !== null && c !== undefined)
          )
        );
        setAllCategories(categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchAllCategories();
  }, []);

  // Define the fetcher function that accepts page and returns Promise<Course[]>
  const fetchCourses = useCallback(
    async (page: number) => {
      return await getCourses(page, 6, {
        category: selectedCategory,
        tags: selectedTags,
        search: searchQuery,
      });
    },
    [selectedCategory, selectedTags, searchQuery]
  );

  // Use the infinite scroll hook
  const {
    data: courses,
    loading,
    error,
    hasMore,
    bottomRef,
  } = useInfiniteScroll<Course>({
    fetchData: fetchCourses,
    dependencies: [selectedCategory, selectedTags, searchQuery],
    limit: 6,
  });

  const allTags = useMemo(() => {
    return Array.from(new Set(courses.flatMap((c) => c.tags)));
  }, [courses]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const [tagQuery, setTagQuery] = useState('');

  const addTagFromQuery = (q?: string) => {
    const val = (q ?? tagQuery).trim();
    if (!val) return;
    const match = allTags.find((t) => t.toLowerCase() === val.toLowerCase());
    const tagToAdd = match ?? val;
    setSelectedTags((prev) => (prev.includes(tagToAdd) ? prev : [...prev, tagToAdd]));
    setTagQuery('');
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <HeaderComponent />

      <main className="flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-6">
          <div className="mb-6 flex flex-col items-start justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <Select
                value={selectedCategory ?? 'all'}
                onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-48 font-bold">
                  <SelectValue placeholder="Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-start gap-3">
                <div className="mt-2 text-sm font-semibold">Tags:</div>
                <div className="flex w-full flex-col md:w-auto">
                  <div className="flex items-center gap-2">
                    <Input
                      value={tagQuery}
                      onChange={(e) => setTagQuery((e.target as HTMLInputElement).value)}
                      placeholder="Search or type to add tags"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTagFromQuery();
                        }
                      }}
                      className="w-48 text-sm"
                    />
                    <Button onClick={() => addTagFromQuery()} className="text-sm">
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="ghost" onClick={resetFilters} className="ml-2">
                Reset
              </Button>
            </div>

            <div className="flex w-full items-center justify-end md:w-auto">
              <div className="flex w-full max-w-sm items-center space-x-0">
                <Input
                  type="text"
                  placeholder="Search courses"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  className="w-full rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 md:w-64"
                />
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-l-none px-4">
                  <FaSearch className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {selectedTags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} className="flex items-center gap-1">
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      aria-label={`Remove ${tag}`}
                      className="rounded text-xs"
                    >
                      <CiCircleRemove size={14} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <h2 className="mb-4 text-2xl font-semibold">Courses</h2>

          {error && <div className="text-destructive">{error}</div>}

          {loading && courses.length === 0 && (
            <div className="flex min-h-[40vh] w-full items-center justify-center">
              <Spinner className="size-16" />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            {!loading && courses.length === 0 && <div>No courses match your filters.</div>}
          </div>

          {/* SPINNER: LOAD MORE (Small Spinner at the bottom) */}
          {loading && courses.length > 0 && (
            <div className="flex w-full items-center justify-center py-4">
              <Spinner />
            </div>
          )}

          {/* End of list message - pushed to bottom */}
          {!loading && !hasMore && courses.length > 0 && (
            <div className="mt-auto flex w-full items-center justify-center py-4 text-sm opacity-80">
              No more courses available.
            </div>
          )}

          {/* Scroll Sentinel */}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </main>
    </div>
  );
}
