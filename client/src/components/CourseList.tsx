import HeaderComponent from './HeaderComponent';
import CourseCard from './CourseCard';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CiCircleRemove } from 'react-icons/ci';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
};

const mockCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Modern React Patterns',
    thumbnail: 'https://picsum.photos/seed/modern-react-patterns/640/360',
    category: 'Web Development',
    tags: ['react', 'components', 'performance'],
    instructor: 'Aisha Khan',
    shortDescription:
      'Explore advanced React patterns and hooks to build scalable, maintainable applications.',
  },
  {
    id: 'course-2',
    title: 'TypeScript Deep Dive',
    thumbnail: 'https://picsum.photos/seed/typescript-deep-dive/640/360',
    category: 'Programming',
    tags: ['typescript', 'nodejs'],
    instructor: 'Marcus Lee',
    shortDescription: 'Master TypeScript features and typing strategies for real-world codebases.',
  },
  {
    id: 'course-3',
    title: 'Design Systems in Practice',
    thumbnail: 'https://picsum.photos/seed/design-systems/640/360',
    category: 'UI/UX',
    tags: ['design', 'components'],
    instructor: 'Clara Romano',
    shortDescription:
      'Learn how to create and maintain a robust design system that teams can trust.',
  },
];

export default function CourseList() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    mockCourses.forEach((c) => c.category && set.add(c.category));
    return Array.from(set);
  }, []);

  const allTags = useMemo(() => {
    return Array.from(new Set(mockCourses.flatMap((c) => c.tags)));
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const [tagQuery, setTagQuery] = useState('');

  const addTagFromQuery = (q?: string) => {
    const val = (q ?? tagQuery).trim();
    if (!val) return;
    // Prefer exact match from allTags (case-insensitive), otherwise add raw value
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
    return mockCourses.filter((c) => {
      const categoryMatch = !selectedCategory || c.category === selectedCategory;
      const tagsMatch = selectedTags.length === 0 || selectedTags.every((t) => c.tags.includes(t));
      return categoryMatch && tagsMatch;
    });
  }, [selectedCategory, selectedTags]);

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

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
