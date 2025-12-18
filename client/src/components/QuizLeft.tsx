import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaFileAlt } from 'react-icons/fa';

interface Props {
  lessons: any[];
  openLesson: string | null;
  setOpenLesson: (id: string | null) => void;
  activeQuiz: string;
  setActiveQuiz: (id: string) => void;
  onSelectQuiz?: (quizId: string, lessonId: string) => void;
  courseId?: string | undefined;
}

export default function QuizLeft({ lessons, openLesson, setOpenLesson, activeQuiz, setActiveQuiz, courseId, onSelectQuiz }: Props) {
  const navigate = useNavigate();

  return (
    <div className="h-full w-80 overflow-y-auto p-4 ">
      <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-500 uppercase">
        Course Content
      </h3>
      <div className="space-y-2">
        {lessons.map((lesson) => {
          const isOpenLesson = openLesson === lesson.id;
          return (
            <div key={lesson.id} className='me-4'>
              <div
                onClick={() => setOpenLesson(isOpenLesson ? null : lesson.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${isOpenLesson ? 'bg-slate-100 border-slate-300 border' : 'border border-transparent hover:bg-slate-100'}`}
              >
                <div className="mt-1 text-slate-400">
                  <FaBook size={12} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {lesson.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{lesson.quizzes?.length || 0} quiz(zes)</p>
                </div>
              </div>

              {isOpenLesson && (
                <div className="mt-2 ml-3 space-y-1 border-l-2 border-slate-200 pl-3">
                  {(lesson.quizzes && lesson.quizzes.length ? lesson.quizzes : []).map((quiz: any) => {
                    const id = quiz.id;
                    const isActive = activeQuiz === id;
                    return (
                      <div
                        key={id}
                        onClick={() => {
                          if (typeof onSelectQuiz === 'function') {
                            onSelectQuiz(id, lesson.id);
                          } else {
                            navigate(`/courses/${courseId}/quiz/${id}`);
                            setActiveQuiz(id);
                            setOpenLesson(lesson.id);
                          }
                        }}
                        className={`flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 border-primary/20 border text-primary font-semibold'
                            : 'border border-transparent hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className={`mt-1 ${isActive ? 'text-primary' : 'text-slate-400'}`}>
                          <FaFileAlt size={10} />
                        </div>
                        <span>{quiz.title || `Quiz ${quiz.id}`}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
