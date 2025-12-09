import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/axiosClient';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  FaBars,
  FaPlay,
  FaFileAlt,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaCode,
} from 'react-icons/fa';
import HeaderComponent from './HeaderComponent';

// --- Types ---
interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'article' | 'quiz';
  content: string; // URL for video, text for article
  duration?: number; // in minutes
}

interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

// --- API Functions ---
const fetchCourseForViewer = async (courseId: string): Promise<Course> => {
  console.log('Fetching course:', courseId);
  const response = await api.get(`/api/courses/${courseId}/lessons`);
  const lessons: Lesson[] = response.data.map((l: any) => ({
    ...l,
    // server returns `content_type` and `duration` in seconds
    content_type: l.content_type || l.contentType,
    duration: l.duration ? Math.round(l.duration / 60) : undefined,
  }));
  return { id: courseId, title: `Course ${courseId}`, lessons };
};

const fetchLessonDetails = async (courseId: string, lessonId: string): Promise<Lesson> => {
  const response = await api.get(`/api/courses/${courseId}/lessons/${lessonId}`);
  const data = response.data;
  return {
    ...data,
    content_type: data.content_type || data.contentType,
    duration: data.duration ? Math.round(data.duration / 60) : undefined,
  };
};

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Resizable Editor Logic
  const [editorWidth, setEditorWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseMoveEvent.clientX;
        if (newWidth > 200 && newWidth < 800) {
          setEditorWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Fetch Course Structure (Cached for 5 minutes)
  const {
    data: course,
    isLoading: isCourseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseForViewer(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Current Lesson Details (Cached for 5 minutes)
  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError,
  } = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: () => fetchLessonDetails(courseId!, lessonId!),
    enabled: !!courseId && !!lessonId,
    staleTime: 1000 * 60 * 5,
  });

  // Memoize navigation logic to avoid recalculation on every render
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!course?.lessons || !lessonId) return { prevLesson: null, nextLesson: null };
    const currentIndex = course.lessons.findIndex((l) => l.id === lessonId);
    if (currentIndex === -1) return { prevLesson: null, nextLesson: null };

    return {
      prevLesson: currentIndex > 0 ? course.lessons[currentIndex - 1] : null,
      nextLesson:
        currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null,
    };
  }, [course, lessonId]);

  const handleLessonChange = (newLessonId: string) => {
    navigate(`/courses/${courseId}/lessons/${newLessonId}`);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Initial Loading State (Only for Course Structure)
  if (isCourseLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
      </div>
    );
  }

  // Course Error State
  if (courseError || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
        <h2 className="text-destructive text-2xl font-bold">Error loading course</h2>
        <Button onClick={() => navigate(`/courses/${courseId}`)} variant="secondary">
          Back to Course
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <HeaderComponent />

      {/* Top Navigation Bar */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <FaBars />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-medium tracking-wider text-slate-500 uppercase">
              Course
            </span>
            <h1
              className="max-w-[200px] truncate text-sm font-bold md:max-w-md md:text-base"
              title={course.title}
            >
              {course.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="hidden border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:flex"
          >
            Exit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="text-slate-500 md:hidden"
          >
            <FaTimes />
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sidebar (Burger Menu) */}
        <aside
          className={`absolute z-10 h-full overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 ease-in-out md:relative ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'} `}
        >
          <div className="h-full w-80 overflow-y-auto p-4">
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
              Course Content
            </h3>
            <div className="space-y-2">
              {course.lessons.map((l, index) => {
                const isActive = l.id === lessonId;
                return (
                  <div
                    key={l.id}
                    onClick={() => handleLessonChange(l.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${isActive ? 'bg-primary/10 border-primary/20 border' : 'border border-transparent hover:bg-slate-100'} `}
                  >
                    <div className={`mt-1 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                      {l.content_type === 'video' ? <FaPlay size={12} /> : <FaFileAlt size={12} />}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-700'}`}
                      >
                        {index + 1}. {l.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{l.content_type}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="relative flex w-full flex-1 flex-col overflow-hidden bg-slate-50 md:flex-row">
          {/* Center: Main Content (Video/Reading) */}
          <div className="flex h-full flex-1 flex-col overflow-y-auto">
            {isLessonLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"></div>
              </div>
            ) : lessonError || !lesson ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <h2 className="text-destructive text-xl font-bold">Error loading lesson</h2>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
                {/* Lesson Header */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="border-slate-300 text-slate-500 capitalize">
                      {lesson.content_type}
                    </Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{lesson.title}</h2>
                </div>

                {/* Content Viewer */}
                <Card className="mb-8 overflow-hidden border-slate-200 bg-white shadow-sm">
                  {lesson.content_type === 'video' ? (
                    <div className="group relative flex aspect-video items-center justify-center bg-slate-900">
                      {/* Placeholder for Video Player */}
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:scale-110">
                          <FaPlay className="ml-1 h-6 w-6 text-white" />
                        </div>
                        <p className="text-slate-300">Video Player Placeholder</p>
                        <p className="mt-2 text-xs text-slate-400">{lesson.content}</p>
                      </div>
                    </div>
                  ) : (
                    <CardContent className="prose max-w-none p-8 text-slate-700">
                      {/* Placeholder for Article/Text Content */}
                      <div className="whitespace-pre-wrap">
                        {lesson.content || 'No content available for this lesson.'}
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Navigation Buttons */}
                <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-4">
                  <Button
                    variant="ghost"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && handleLessonChange(prevLesson.id)}
                    className="cursor-pointer text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <FaChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    disabled={!nextLesson}
                    onClick={() => nextLesson && handleLessonChange(nextLesson.id)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                  >
                    Next Lesson
                    <FaChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="hover:bg-primary z-20 hidden w-1 shrink-0 cursor-col-resize bg-slate-200 transition-colors lg:block"
            onMouseDown={startResizing}
          />

          {/* Right: Live Editor / Quizzes (Placeholder) */}
          <div
            className="hidden shrink-0 flex-col border-l border-slate-200 bg-white lg:flex"
            style={{ width: editorWidth }}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 p-4">
              <FaCode className="text-primary" />
              <h3 className="font-semibold text-slate-700">Interactive Area</h3>
            </div>
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
                  <FaCode className="h-8 w-8 text-slate-400" />
                </div>
                <div>
                  <h4 className="mb-1 font-medium text-slate-700">Live Editor / Quiz</h4>
                  <p className="text-sm text-slate-500">
                    This space is reserved for interactive coding exercises or quizzes related to
                    the lesson.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-500"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
