import HeaderComponent from './HeaderComponent';
import CourseCard from './CourseCard';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CiCircleRemove } from 'react-icons/ci';
import { FaSearch } from 'react-icons/fa';

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

const mockCourses: Course[] = [];

export default function CourseList() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const isMountedRef = useRef(true);

  const loadPage = useCallback(
    async (targetPage = 1, replace = false) => {
      const limit = 6;
      setLoading(true);
      setError(null);
      try {
        const data = await getCourses(targetPage, limit, {
          category: selectedCategory,
          tags: selectedTags,
          search: searchQuery,
        });
        if (!isMountedRef.current) return;
        if (replace) {
          setCourses(data);
        } else {
          setCourses((prev) => [...prev, ...data]);
        }

        // if fewer results than a full page, there are no more pages
        if (data.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // advance the next page pointer
        setPage(targetPage + 1);
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err?.message ?? 'Failed to load courses');
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [selectedCategory, selectedTags, searchQuery]
  );

  const resetAndLoad = useCallback(() => {
    setCourses([]);
    setPage(1);
    setHasMore(true);
    loadPage(1, true);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    loadPage(page);
  }, [loading, hasMore, page, loadPage]);

  const observer = useRef<IntersectionObserver | null>(null);

  const bottomRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasMore, loadMore]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => c.category && set.add(c.category));
    return Array.from(set);
  }, [courses]);

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

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const categoryMatch = !selectedCategory || c.category === selectedCategory;
      const tagsMatch = selectedTags.length === 0 || selectedTags.every((t) => c.tags.includes(t));
      const q = searchQuery.trim().toLowerCase();
      const queryMatch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.shortDescription.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q));

      return categoryMatch && tagsMatch && queryMatch;
    });
  }, [courses, selectedCategory, selectedTags, searchQuery]);

  useEffect(() => {
    isMountedRef.current = true;
    resetAndLoad();
    return () => {
      isMountedRef.current = false;
    };
  }, [resetAndLoad]);

  // Reload courses whenever filters change (category, tags, search)
  useEffect(() => {
    resetAndLoad();
  }, [resetAndLoad]);

  return (
    <div className="bg-background min-h-screen">
      <HeaderComponent />

      <main>
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          <div className="mb-6 flex flex-col items-start justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <Select
                value={selectedCategory ?? undefined}
                onValueChange={(v) => setSelectedCategory(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-48 font-bold">
                  <SelectValue placeholder="Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((cat) => (
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
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            {!loading && filtered.length === 0 && courses.length > 0 && (
              <div>No courses match your filters.</div>
            )}
          </div>

          {/* SPINNER 2: LOAD MORE ONLY (Small Spinner at the bottom) */}
          {loading && courses.length > 0 && (
            <div className="flex w-full items-center justify-center py-4">
              <Spinner />
            </div>
          )}

          {/* End of list message */}
          {!loading && !hasMore && courses.length > 0 && (
            <div className="flex w-full items-center justify-center py-4 text-sm opacity-80">
              No more courses.
            </div>
          )}

          {/* Scroll Sentinel */}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </main>
    </div>
  );
}
