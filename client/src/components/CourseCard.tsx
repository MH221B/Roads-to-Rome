import * as React from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Progress } from "@/components/ui/progress";

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: string;
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
    if (typeof value === "number") setLocal(Math.round(value * 2) / 2);
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
              <svg viewBox="0 0 20 20" fill={fill ? "currentColor" : "none"} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.18c.969 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.388-2.46a1 1 0 00-1.176 0l-3.388 2.46c-.785.57-1.84-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.045 9.397c-.783-.57-.38-1.81.588-1.81h4.18a1 1 0 00.95-.69l1.286-3.97z"/>
              </svg>
            </button>
          );
        })}
      </div>
      <div className="text-sm text-muted-foreground">{(value ?? 0).toFixed(1)}</div>
    </div>
  );
}

const CourseCard: React.FC<Props> = ({ course, showProgress = false, progress = null, rating = null, onRate }) => {
  return (
    <Card className="overflow-hidden p-0 h-auto flex flex-col gap-2">
      <AspectRatio ratio={16 / 9}>
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      </AspectRatio>

      <CardHeader className="p-0 pt-2 pb-0 px-3">
        <div>
          <CardTitle className="leading-tight">{course.title}</CardTitle>
          <CardDescription className="mt-1 text-sm text-muted-foreground">
            {course.instructor}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 py-0 px-3">
        <div className="text-sm text-muted-foreground">
          {course.shortDescription}
        </div>
      </CardContent>

      <CardFooter className="p-0 pt-2 pb-5 px-3 mt-auto">
        <div className="flex flex-col gap-2 w-full">
          {showProgress && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium">Progress</div>
                <div className="text-xs text-muted-foreground">{progress ?? 0}%</div>
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
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
