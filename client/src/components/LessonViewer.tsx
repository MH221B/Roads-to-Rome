import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/axiosClient';
import { useAuth } from '../contexts/AuthProvider';
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
  FaEdit,
  FaClipboardList,
  FaEye,
} from 'react-icons/fa';
import { decodeJwtPayload } from '../lib/utils';
import LessonCodeEditor from './LessonCodeEditor';

// --- Types ---
interface Lesson {
  id: string;
  course_id: string;
  title: string;
  lessonType?: 'theory' | 'practical' | 'lab';
  content: string; // HTML content
  video?: string; // URL to video file
  duration?: number; // in seconds
  order?: number;
  quizzes?: Array<{ id: string; title?: string; order?: number }>;
  attachments?: Array<{ name: string; url: string } | string>; // array of attachment objects or URLs
}

interface Course {
  id: string;
  title: string;
  lessons: Lesson[];
}

// --- API Functions ---
const fetchCourseForViewer = async (courseId: string): Promise<Course> => {
  const response = await api.get(`/api/courses/${courseId}/lessons`);
  const payload = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.lessons)
      ? response.data.lessons
      : [];

  const lessons: Lesson[] = payload.map((l: any) => ({
    ...l,
    lessonType: l.lessonType,
    video: l.video,
    duration: l.duration,
    quizzes: l.quizzes || [],
    attachments: l.attachments || [],
  }));

  const title =
    response.data?.course?.title ||
    response.data?.title ||
    response.data?.courseName ||
    `Course ${courseId}`;

  return { id: courseId, title, lessons };
};

const fetchLessonDetails = async (courseId: string, lessonId: string): Promise<Lesson> => {
  const response = await api.get(`/api/courses/${courseId}/lessons/${lessonId}`);
  const data = response.data?.lesson || response.data;
  return {
    ...data,
    lessonType: data?.lessonType,
    video: data?.video,
    duration: data?.duration,
    quizzes: data?.quizzes || [],
    attachments: data?.attachments || [],
  };
};

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const queryClient = useQueryClient();

  // Decode JWT and extract roles
  const payload = useMemo(() => decodeJwtPayload(accessToken), [accessToken]);
  const rawRoles = payload?.roles ?? payload?.role;
  const roles: string[] = (Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : []).map(
    (r) => String(r).toUpperCase()
  );

  const isInstructor = roles.includes('INSTRUCTOR') || roles.includes('ADMIN');
  const isStudent = roles.includes('STUDENT');

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const resp = await api.get('/api/enrollments');
      return resp.data as any[];
    },
    enabled: isStudent,
    staleTime: 1000 * 60, // 1 minute
  });

  const enrollmentForCourse = useMemo(() => {
    if (!courseId || !enrollmentsQuery.data) return null;
    return (
      enrollmentsQuery.data.find((e: any) => {
        const cid = e?.course?.id || e?.course_id || e?.courseId;
        return String(cid) === String(courseId);
      }) || null
    );
  }, [courseId, enrollmentsQuery.data]);

  const courseProgress = useMemo(() => {
    return typeof enrollmentForCourse?.progress === 'number'
      ? Math.max(0, Math.min(100, enrollmentForCourse.progress))
      : 0;
  }, [enrollmentForCourse]);

  const completedLessons = useMemo(() => {
    return enrollmentForCourse?.completed_lessons || [];
  }, [enrollmentForCourse]);

  const isEnrolled = Boolean(enrollmentForCourse);

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

  const displayTitle = useMemo(() => {
    return (
      enrollmentForCourse?.course?.title ||
      (enrollmentForCourse as any)?.course?.name ||
      course?.title ||
      courseId ||
      'Course'
    );
  }, [course?.title, courseId, enrollmentForCourse]);

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

  const editorStarterCode = useMemo(() => {
    const lessonName = lesson?.title || 'Lesson';
    return {
      python: `# ${lessonName}\n\ndef solve(input: str):\n    return input\n\nprint(solve("sample input"))\n`,
      cpp: `// ${lessonName}\n#include <bits/stdc++.h>\nusing namespace std;\n\nstring solve(const string &input) {\n  return input;\n}\n\nint main() {\n  ios::sync_with_stdio(false);\n  cin.tie(nullptr);\n  cout << solve("sample input") << "\\n";\n  return 0;\n}\n`,
    } as const;
  }, [lesson?.title]);

  const runLessonCode = useCallback(
    async ({ code, language }: { code: string; language: 'python' | 'cpp' }) => {
      const normalized = language.toUpperCase();
      return `Submitted ${normalized} solution for ${lesson?.title || 'this lesson'}. Connect the run endpoint to execute.`;
    },
    [lesson?.title]
  );

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
    completeLesson.reset();
    navigate(`/courses/${courseId}/lessons/${newLessonId}`);
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const completeLesson = useMutation({
    mutationFn: async () => {
      if (!courseId || !lessonId) throw new Error('Missing course or lesson');
      await api.post(`/api/courses/${courseId}/lessons/${lessonId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });

  useEffect(() => {
    // Clear success/error state when switching lessons
    completeLesson.reset();
  }, [lessonId]);

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
    <div className="flex h-screen flex-col bg-white">
      {/* Top Navigation Bar */}
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            title="Back to course"
          >
            <FaChevronLeft />
          </Button>
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
              title={displayTitle}
            >
              {displayTitle}
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
                const isCompleted = completedLessons.includes(l.id);
                const baseClass = isActive
                  ? 'bg-primary/10 border-primary/20 border text-primary'
                  : isCompleted
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'border border-transparent hover:bg-slate-100';
                const iconClass = isActive
                  ? 'text-primary'
                  : isCompleted
                    ? 'text-emerald-600'
                    : 'text-slate-400';
                const titleClass = isActive
                  ? 'text-primary'
                  : isCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-700';

                return (
                  <div
                    key={l.id}
                    onClick={() => handleLessonChange(l.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${baseClass}`}
                  >
                    <div className={`mt-1 ${iconClass}`}>
                      {l.video ? <FaPlay size={12} /> : <FaFileAlt size={12} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${titleClass}`}>
                        {index + 1}. {l.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{l.lessonType || 'lesson'}</p>
                    </div>
                    {isCompleted && !isActive && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        Done
                      </Badge>
                    )}
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
                      {lesson.lessonType || 'lesson'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
                      {lesson.title}
                    </h2>
                    {isInstructor && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/courses/${courseId}/lessons/${lessonId}/edit`)}
                        className="shrink-0 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <FaEdit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content Viewer */}
                <Card className="mb-8 overflow-hidden border-slate-200 bg-white shadow-sm">
                  <CardContent className="prose prose-sm md:prose-base max-w-none p-8 text-slate-700">
                    {/* HTML Content Renderer */}
                    <div
                      className="prose-a:text-primary prose-a:underline prose-h1:text-slate-900 prose-h2:text-slate-900 prose-h3:text-slate-800 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:text-slate-900 prose-code:px-2 prose-code:py-1 prose-code:rounded"
                      dangerouslySetInnerHTML={{
                        __html: lesson.content || '<p>No content available for this lesson.</p>',
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Video Section */}
                {lesson.video && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Lesson Video</h3>
                    <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
                      <div className="group relative flex aspect-video items-center justify-center bg-slate-900">
                        {/* Video Player - Support YouTube, Vimeo, or direct video URLs */}
                        {lesson.video.includes('youtube.com') ||
                        lesson.video.includes('youtu.be') ? (
                          <iframe
                            className="h-full w-full"
                            src={lesson.video
                              .replace('watch?v=', 'embed/')
                              .replace('youtu.be/', 'youtube.com/embed/')}
                            title={lesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : lesson.video.includes('vimeo.com') ? (
                          <iframe
                            className="h-full w-full"
                            src={lesson.video}
                            title={lesson.title}
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : lesson.video.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video
                            className="h-full w-full bg-black"
                            controls
                            controlsList="nodownload"
                          >
                            <source src={lesson.video} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 transition-transform group-hover:scale-110">
                              <FaPlay className="ml-1 h-6 w-6 text-white" />
                            </div>
                            <p className="text-slate-300">Video Player</p>
                            <p className="mt-2 text-xs text-slate-400">{lesson.video}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Attachments Section */}
                {lesson.attachments && lesson.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-4 text-lg font-semibold text-slate-900">Attachments</h3>
                    <Card className="border-slate-200 bg-white shadow-sm">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {lesson.attachments.map((attachment, index) => {
                            // Handle both string (URL) and object formats
                            const attachmentUrl =
                              typeof attachment === 'string' ? attachment : attachment?.url;
                            const attachmentName =
                              typeof attachment === 'string' ? null : attachment?.name;
                            const fileName =
                              attachmentName ||
                              attachmentUrl?.split('/').pop() ||
                              `Attachment ${index + 1}`;

                            if (!attachmentUrl) return null;

                            return (
                              <div
                                key={index}
                                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                              >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                  <FaFileAlt className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-slate-900">
                                    {fileName}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">{attachmentUrl}</p>
                                </div>
                                <Button
                                  onClick={() => window.open(attachmentUrl, '_blank')}
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                                >
                                  <FaEye className="mr-2 h-4 w-4" />
                                  View
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Quiz Button */}
                {lesson.quizzes && lesson.quizzes.length > 0 && (
                  <div className="mb-6">
                    <Button
                      onClick={() => navigate(`/courses/${courseId}/quiz/${lesson.quizzes![0].id}`)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
                      size="lg"
                    >
                      <FaClipboardList className="mr-2 h-5 w-5" />
                      Go to Quiz: {lesson.quizzes[0].title || 'Quiz'}
                    </Button>
                  </div>
                )}

                {/* Completion + Navigation Buttons */}
                <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      variant="outline"
                      disabled={!isStudent || !isEnrolled || completeLesson.isPending}
                      onClick={() => completeLesson.mutate()}
                      className="border-slate-200 text-slate-700 hover:bg-slate-100"
                    >
                      {completeLesson.isPending ? 'Marking…' : 'Mark lesson complete'}
                    </Button>
                    {completeLesson.isError && (
                      <span className="text-destructive text-xs">Failed to update progress</span>
                    )}
                    {completeLesson.isSuccess && (
                      <span className="text-xs text-emerald-600">Progress updated</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
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
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            className="hover:bg-primary z-20 hidden w-1 shrink-0 cursor-col-resize bg-slate-200 transition-colors lg:block"
            onMouseDown={startResizing}
          />

          {/* Right: Live Editor / Code Runner */}
          <div
            className="hidden h-full shrink-0 flex-col border-l border-slate-200 bg-white lg:flex"
            style={{ width: editorWidth }}
          >
            {isLessonLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="border-primary h-10 w-10 animate-spin rounded-full border-t-2 border-b-2"></div>
              </div>
            ) : lessonError || !lesson ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
                <FaCode className="h-6 w-6 text-slate-400" />
                <p className="text-sm text-slate-600">Interactive area unavailable.</p>
              </div>
            ) : (
              <LessonCodeEditor
                key={lessonId}
                title={`Practice: ${lesson.title}`}
                starterCode={editorStarterCode}
                initialLanguage="python"
                onRun={runLessonCode}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
