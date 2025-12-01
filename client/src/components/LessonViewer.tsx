import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
// import { api } from '../services/axiosClient';
import RequireRole from './RequireRole';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { FaBars, FaPlay, FaFileAlt, FaChevronLeft, FaChevronRight, FaTimes, FaCode } from 'react-icons/fa';
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

const MOCK_COURSE_VIEWER: Course = {
  id: "1",
  title: "The Complete 2024 Web Development Bootcamp",
  lessons: [
    { id: "l1", course_id: "1", title: "Introduction to HTML", content_type: "video", content: "video_url", duration: 10 },
    { id: "l2", course_id: "1", title: "CSS Basics", content_type: "video", content: "video_url", duration: 15 },
    { id: "l3", course_id: "1", title: "Javascript Fundamentals", content_type: "article", content: "article_content", duration: 20 },
    { id: "l4", course_id: "1", title: "React Hooks", content_type: "video", content: "video_url", duration: 25 },
  ]
};

const MOCK_LESSONS_DATA: Record<string, Lesson> = {
  "l1": { id: "l1", course_id: "1", title: "Introduction to HTML", content_type: "video", content: "This is a placeholder for the HTML video content.", duration: 10 },
  "l2": { id: "l2", course_id: "1", title: "CSS Basics", content_type: "video", content: "This is a placeholder for the CSS video content.", duration: 15 },
  "l3": { id: "l3", course_id: "1", title: "Javascript Fundamentals", content_type: "article", content: "# JavaScript Fundamentals\n\nJavaScript is a versatile language...\n\n## Variables\n\n`let` and `const` are used to declare variables.", duration: 20 },
  "l4": { id: "l4", course_id: "1", title: "React Hooks", content_type: "video", content: "This is a placeholder for the React Hooks video content.", duration: 25 },
};

// --- API Functions ---
const fetchCourseForViewer = async (courseId: string) => {
  console.log("Fetching course:", courseId);
  // const response = await api.get<Course>(`/api/courses/${courseId}`);
  // return response.data;
  return new Promise<Course>((resolve) => {
    setTimeout(() => resolve(MOCK_COURSE_VIEWER), 500);
  });
};

const fetchLessonDetails = async (lessonId: string) => {
  // const response = await api.get<Lesson>(`/api/lessons/${lessonId}`);
  // return response.data;
  return new Promise<Lesson>((resolve) => {
    setTimeout(() => {
      const lesson = MOCK_LESSONS_DATA[lessonId] || MOCK_LESSONS_DATA["l1"];
      resolve(lesson);
    }, 500);
  });
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
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Fetch Course Structure (Cached for 5 minutes)
  const { data: course, isLoading: isCourseLoading, error: courseError } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseForViewer(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5, 
  });

  // Fetch Current Lesson Details (Cached for 5 minutes)
  const { data: lesson, isLoading: isLessonLoading, error: lessonError } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => fetchLessonDetails(lessonId!),
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5,
  });

  // Memoize navigation logic to avoid recalculation on every render
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!course?.lessons || !lessonId) return { prevLesson: null, nextLesson: null };
    const currentIndex = course.lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return { prevLesson: null, nextLesson: null };
    
    return {
      prevLesson: currentIndex > 0 ? course.lessons[currentIndex - 1] : null,
      nextLesson: currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Course Error State
  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 gap-4">
        <h2 className="text-2xl font-bold text-destructive">Error loading course</h2>
        <Button onClick={() => navigate(`/courses/${courseId}`)} variant="secondary">Back to Course</Button>
      </div>
    );
  }

  return (
    <RequireRole roles={['STUDENT', 'INSTRUCTOR', 'ADMIN']}>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
        <HeaderComponent />
        
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0 z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
              <FaBars />
            </Button>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Course</span>
              <h1 className="text-sm md:text-base font-bold truncate max-w-[200px] md:max-w-md" title={course.title}>
                {course.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/courses/${courseId}`)} className="hidden md:flex border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              Exit
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate(`/courses/${courseId}`)} className="md:hidden text-slate-500">
              <FaTimes />
            </Button>
          </div>
        </header>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Sidebar (Burger Menu) */}
          <aside 
            className={`
              absolute md:relative z-10 h-full bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-hidden
              ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}
            `}
          >
            <div className="h-full overflow-y-auto p-4 w-80">
              <h3 className="font-semibold text-slate-500 mb-4 text-sm uppercase tracking-wider">Course Content</h3>
              <div className="space-y-2">
                {course.lessons.map((l, index) => {
                  const isActive = l.id === lessonId;
                  return (
                    <div 
                      key={l.id}
                      onClick={() => handleLessonChange(l.id)}
                      className={`
                        p-3 rounded-lg cursor-pointer flex items-start gap-3 transition-colors
                        ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-slate-100 border border-transparent'}
                      `}
                    >
                      <div className={`mt-1 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                        {l.content_type === 'video' ? <FaPlay size={12} /> : <FaFileAlt size={12} />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-700'}`}>
                          {index + 1}. {l.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {l.content_type}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 relative w-full">
            
            {/* Center: Main Content (Video/Reading) */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto">
              {isLessonLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : lessonError || !lesson ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <h2 className="text-xl font-bold text-destructive">Error loading lesson</h2>
                  <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
                </div>
              ) : (
                <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
                  
                  {/* Lesson Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-slate-300 text-slate-500 capitalize">
                        {lesson.content_type}
                      </Badge>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{lesson.title}</h2>
                  </div>

                  {/* Content Viewer */}
                  <Card className="bg-white border-slate-200 overflow-hidden mb-8 shadow-sm">
                    {lesson.content_type === 'video' ? (
                      <div className="aspect-video bg-slate-900 flex items-center justify-center relative group">
                        {/* Placeholder for Video Player */}
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <FaPlay className="ml-1 text-white h-6 w-6" />
                          </div>
                          <p className="text-slate-300">Video Player Placeholder</p>
                          <p className="text-xs text-slate-400 mt-2">{lesson.content}</p>
                        </div>
                      </div>
                    ) : (
                      <CardContent className="p-8 prose max-w-none text-slate-700">
                        {/* Placeholder for Article/Text Content */}
                        <div className="whitespace-pre-wrap">
                          {lesson.content || "No content available for this lesson."}
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-200">
                    <Button 
                      variant="ghost" 
                      disabled={!prevLesson}
                      onClick={() => prevLesson && handleLessonChange(prevLesson.id)}
                      className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
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
              className="hidden lg:block w-1 bg-slate-200 hover:bg-primary cursor-col-resize transition-colors z-20 shrink-0"
              onMouseDown={startResizing}
            />

            {/* Right: Live Editor / Quizzes (Placeholder) */}
            <div 
              className="hidden lg:flex border-l border-slate-200 bg-white flex-col shrink-0"
              style={{ width: editorWidth }}
            >
              <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                <FaCode className="text-primary" />
                <h3 className="font-semibold text-slate-700">Interactive Area</h3>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="space-y-4">
                  <div className="w-16 h-16 rounded-lg bg-slate-50 mx-auto flex items-center justify-center border border-slate-200 border-dashed">
                    <FaCode className="text-slate-400 h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-slate-700 font-medium mb-1">Live Editor / Quiz</h4>
                    <p className="text-sm text-slate-500">
                      This space is reserved for interactive coding exercises or quizzes related to the lesson.
                    </p>
                  </div>
                  <Button variant="outline" className="border-slate-200 text-slate-500 w-full" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </RequireRole>
  );
}
