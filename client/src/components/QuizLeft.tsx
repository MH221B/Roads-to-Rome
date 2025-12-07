import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

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
    <aside className="col-span-3 border-r p-4 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Lessons</h2>

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="border-b pb-2">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpenLesson(openLesson === lesson.id ? null : lesson.id)}
              >
                <h3 className="font-semibold mb-2">{lesson.title}</h3>
                <span>{openLesson === lesson.id ? '-' : '+'}</span>
              </div>

              {openLesson === lesson.id && (
                <div className="space-y-1 ml-2 mt-2">
                  {(lesson.quizzes && lesson.quizzes.length ? lesson.quizzes : []).map((quiz: any) => {
                    const id = quiz.id;
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
                        className={`text-sm cursor-pointer p-1 rounded-md transition-colors duration-150 ${activeQuiz === id
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'hover:underline hover:bg-gray-50'
                          }`}
                      >
                        {quiz.title ? quiz.title : `Quiz ${lesson.id}.${quiz.id}`}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
