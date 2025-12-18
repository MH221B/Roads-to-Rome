import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Question } from '@/types/question';

interface Props {
  activeQuiz: string;
  questions: Question[];
  questionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  renderQuestion: (q: Question, cb: (ans: any) => void, disabled?: boolean) => React.ReactNode;
  handleAnswered: (id: string, answer: any) => void;
  locked: boolean;
  reviewMode: boolean;
  selectedAttempt: any | null;
  started?: boolean;
}
export default function QuizMain({activeQuiz, questions, questionRefs, renderQuestion, handleAnswered, locked, reviewMode, selectedAttempt, started = false }: Props) {
  const lockedByNotStarted = !started && !reviewMode;

  return (
    <main className={`flex-1 p-8 overflow-y-auto bg-slate-50 ${lockedByNotStarted ? 'filter blur-sm opacity-60 pointer-events-none select-none' : ''}`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1 w-12 bg-primary rounded-full"></div>
          <h1 className="text-3xl font-bold text-slate-900">Quiz Challenge</h1>
        </div>
        {reviewMode && (
          <p className="text-sm text-slate-600 ml-14">Review Mode - Check your answers below</p>
        )}
        {!started && !reviewMode && (
          <p className="text-sm text-slate-600 ml-14">Click "Start Quiz" to begin</p>
        )}
      </div>

      {reviewMode && selectedAttempt ? (
        (questions || []).map((q, index) => {
          const userAns = (selectedAttempt.answers || []).find((a: any) => a.questionId === q.id)?.answer;
          const isMultiple = q.type === 'multiple';
          const isSingle = q.type === 'single';
          const isDrag = q.type === 'dragdrop';
          const isImage = q.type === 'image';

          return (
            <div key={q.id} ref={(el) => { questionRefs.current[index] = el; }}>
              <Card className="mb-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {index + 1}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Question {index + 1}</h2>
                  </div>
                  <p className="text-slate-700 text-base leading-relaxed">{q.text}</p>

                  {isSingle && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt: string) => {
                        const isCorrect = (q.correctAnswers || []).includes(opt);
                        const isSelected = userAns === opt;
                        const baseClass = isSelected && isCorrect
                          ? 'bg-green-50 border-2 border-green-400 shadow-sm'
                          : isSelected && !isCorrect
                            ? 'bg-red-50 border-2 border-red-400 shadow-sm'
                            : isCorrect
                              ? 'bg-green-50/30 border-2 border-green-300 border-dashed'
                              : 'bg-slate-50 border border-slate-200';

                        return (
                          <div key={opt} className={`p-4 rounded-lg flex items-center justify-between transition-all ${baseClass}`}>
                            <div className="text-sm font-medium text-slate-700">{opt}</div>
                            <div className="text-xs font-semibold">
                              {isSelected && isCorrect && <span className="text-green-700 bg-green-100 px-2 py-1 rounded">✓ Your answer</span>}
                              {isSelected && !isCorrect && <span className="text-red-700 bg-red-100 px-2 py-1 rounded">✗ Wrong</span>}
                              {!isSelected && isCorrect && <span className="text-green-700 bg-green-100 px-2 py-1 rounded">✓ Correct</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isMultiple && (
                    <div className="space-y-2">
                      {(q.options || []).map((opt: string) => {
                        const isCorrect = (q.correctAnswers || []).includes(opt);
                        const isSelected = Array.isArray(userAns) && userAns.includes(opt);
                        const baseClass = isSelected && isCorrect
                          ? 'bg-green-50 border-2 border-green-400 shadow-sm'
                          : isSelected && !isCorrect
                            ? 'bg-red-50 border-2 border-red-400 shadow-sm'
                            : isCorrect
                              ? 'bg-green-50/30 border-2 border-green-300 border-dashed'
                              : 'bg-slate-50 border border-slate-200';

                        return (
                          <div key={opt} className={`p-4 rounded-lg flex items-center justify-between transition-all ${baseClass}`}>
                            <div className="text-sm font-medium text-slate-700">{opt}</div>
                            <div className="text-xs font-semibold">
                              {isSelected && isCorrect && <span className="text-green-700 bg-green-100 px-2 py-1 rounded">✓ Selected</span>}
                              {isSelected && !isCorrect && <span className="text-red-700 bg-red-100 px-2 py-1 rounded">✗ Wrong</span>}
                              {!isSelected && isCorrect && <span className="text-green-700 bg-green-100 px-2 py-1 rounded">✓ Correct</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

          {isDrag && (
                    <div>
                      <div className="text-sm font-semibold mb-3 text-slate-700">Your Answers:</div>
                      <div className="grid grid-cols-2 gap-3">
                        {Array.from({ length: q.slotCount || (q.correctAnswers || []).length }).map((_, sidx) => {
                          const correctVal = (q.correctAnswers || [])[sidx];
                          const userVal = Array.isArray(userAns) ? userAns[sidx] : null;
                          const correct = userVal === correctVal;
                          return (
                            <div key={sidx} className={`p-4 rounded-lg ${correct ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
                              <div className="text-sm font-semibold text-slate-700 mb-2">Slot {sidx + 1}</div>
                              <div className="text-xs text-slate-600 mb-1">Your answer: <span className="font-medium">{userVal ?? '(empty)'}</span></div>
                              <div className="text-xs text-slate-600">Correct: <span className="font-medium text-green-700">{correctVal}</span></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {isImage && (
                    <div>
                      <div className="text-sm font-semibold mb-3 text-slate-700">Your Answer:</div>
                      <div className="grid grid-cols-2 gap-4">
                        {(q.options || []).map((img: string) => {
                          const isCorrect = (q.correctAnswers || []).includes(img);
                          const isSelected = userAns === img;
                          const baseClass = isSelected && isCorrect
                            ? 'border-4 border-green-400 shadow-lg ring-2 ring-green-300'
                            : isSelected && !isCorrect
                              ? 'border-4 border-red-400 shadow-lg ring-2 ring-red-300'
                              : isCorrect
                                ? 'border-2 border-green-300 shadow-md'
                                : 'border border-slate-200';

                          return (
                            <div key={img} className={`relative rounded-lg p-2 flex flex-col items-center transition-all ${baseClass}`}>
                              <img
                                src={img}
                                alt="answer"
                                className="rounded mb-2"
                              />
                              
                              {/* Bottom label */}
                              {(isSelected || isCorrect) && (
                                <div className="mt-2 text-xs font-semibold">
                                  {isSelected && isCorrect && <span className="text-green-700">✓ Your answer (Correct)</span>}
                                  {isSelected && !isCorrect && <span className="text-red-700">✗ Your answer (Wrong)</span>}
                                  {!isSelected && isCorrect && <span className="text-green-700">✓ Correct answer</span>}
                                </div>
                              )}

                              {/* Top badge for non-selected correct answers */}
                              {!isSelected && isCorrect && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold text-lg">
                                  ✓
                                </div>
                              )}

                              {/* Top badge for selected wrong answers */}
                              {isSelected && !isCorrect && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold text-lg">
                                  ✗
                                </div>
                              )}

                              {/* Top badge for selected correct answers */}
                              {isSelected && isCorrect && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg font-bold text-lg">
                                  ✓
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          );
        })
      ) : (
        questions.map((q, index) => (
          <div key={q.id} ref={(el) => { questionRefs.current[index] = el; }}>
            <Card className="mb-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">Question {index + 1}</h2>
                </div>
                <p className="text-slate-700 text-base leading-relaxed">{q.text}</p>

                {renderQuestion(q, (ans) => handleAnswered(q.id, ans), locked)}

              </CardContent>
            </Card>
          </div>
        ))
      )}
    </main>
  );
}
