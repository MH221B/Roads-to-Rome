import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Progress } from '@/components/ui/progress';

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  /** e.g. 'Beginner' | 'Intermediate' | 'Advanced' */
  difficulty?: string | null;
  instructor: string | { id: string | null; name: string };
  shortDescription: string;
};

type Props = {
  course: Course;
  /** show progress bar and rating area (dashboard only) */
  showProgress?: boolean;
  /** 0-100 */
  progress?: number | null;
  /** 0-5 */
  rating?: number | null;
  onRate?: (rating: number) => void;
};

function RatingStars({ value, onRate }: { value?: number | null; onRate?: (v: number) => void }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const [local, setLocal] = React.useState<number>(Math.round((value ?? 0) * 2) / 2);

  React.useEffect(() => {
    if (typeof value === 'number') setLocal(Math.round(value * 2) / 2);
  }, [value]);

  const handleClick = (v: number) => {
    setLocal(v);
    onRate?.(v);
  };

  return (
    <div className="flex items-center gap-2 select-none">
      <div className="flex items-center gap-1 text-yellow-400">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = hover !== null ? (i <= hover ? 1 : 0) : i <= Math.round(local) ? 1 : 0;
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => handleClick(i)}
              className="inline-flex h-5 w-5 items-center justify-center p-0"
              aria-label={`Rate ${i} star`}
            >
              <svg
                viewBox="0 0 20 20"
                fill={fill ? 'currentColor' : 'none'}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.176 0l-3.388 2.46c-.785.57-1.84-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.045 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      <div className="text-muted-foreground text-sm">{(value ?? 0).toFixed(1)}</div>
    </div>
  );
}

const CourseCard: React.FC<Props> = ({
  course,
  showProgress = false,
  progress = null,
  rating = null,
  onRate,
}) => {
  const navigate = useNavigate();

  const handleNavigate = (e: React.MouseEvent | React.KeyboardEvent) => {
    // If the click/keyboard event originated from an interactive element, don't navigate
    const target = (e as React.MouseEvent).target as HTMLElement | null;
    if (target) {
      if (target.closest('button') || target.closest('a')) return;
    }

    navigate(`/courses/${course.id}`);
  };

  return (
    <Card
      onClick={handleNavigate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleNavigate(e);
      }}
      tabIndex={0}
      role="button"
      className="flex h-auto cursor-pointer flex-col gap-2 overflow-hidden p-0 focus:ring-2 focus:ring-offset-2 focus:outline-none"
    >
      <AspectRatio ratio={16 / 9}>
        <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
      </AspectRatio>

      <CardHeader className="p-0 px-3 pt-2 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            {/* --- CATEGORY ADDED HERE --- */}
            {course.category && (
              <span className="text-primary/80 mb-1 text-xs font-semibold tracking-wider uppercase">
                {course.category}
              </span>
            )}

            <CardTitle className="leading-tight">{course.title}</CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-sm">
              {typeof course.instructor === 'string'
                ? course.instructor
                : ((course.instructor as any)?.name ?? '')}
            </CardDescription>
          </div>

          {course.difficulty && (
            <div className="ml-1 shrink-0">
              <Badge>{course.difficulty}</Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 px-3 py-0">
        <div
          className="text-muted-foreground text-sm"
          style={{
            display: '-webkit-box' as any,
            WebkitLineClamp: 3 as any,
            WebkitBoxOrient: 'vertical' as any,
            overflow: 'hidden',
            minHeight: '3.6rem', // keep card heights even when descriptions vary in length
          }}
          title={course.shortDescription}
        >
          {course.shortDescription}
        </div>
      </CardContent>

      <CardFooter className="mt-auto p-0 px-3 pt-2 pb-5">
        <div className="flex w-full flex-col gap-2">
          {showProgress && (
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-xs font-medium">Progress</div>
                <div className="text-muted-foreground text-xs">{progress ?? 0}%</div>
              </div>
              <Progress value={progress ?? 0} />
            </div>
          )}

          {showProgress && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-xs font-medium">Rating</div>
                <RatingStars value={rating ?? 0} onRate={onRate} />
              </div>
              <span className="text-muted-foreground text-xs">
                {typeof rating === 'number' ? rating.toFixed(1) : 'Not rated'}
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
