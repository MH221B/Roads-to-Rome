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

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  category?: string;
  tags: string[];
  instructor: string;
  shortDescription: string;
};

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <Card className="overflow-hidden p-0 h-auto flex flex-col gap-2">
      <AspectRatio ratio={16 / 9}>
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover"
        />
      </AspectRatio>

      <CardHeader className="p-0 pt-2 pb-1 px-3">
        <div>
          <CardTitle className="leading-tight">{course.title}</CardTitle>
          <CardDescription className="mt-0 text-sm text-muted-foreground">
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
        <div className="flex flex-wrap gap-2">
          {course.tags.map((tag) => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
