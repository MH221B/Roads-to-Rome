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
    <main className={`col-span-6 p-6 overflow-y-auto ${lockedByNotStarted ? 'filter blur-sm opacity-60 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        {/* tên quiz */}
        <h1 className="text-2xl font-bold">Quiz  {activeQuiz}</h1>
      </div>

      {reviewMode && selectedAttempt ? (
        (questions || []).map((q, index) => {
          const userAns = (selectedAttempt.answers || []).find((a: any) => a.questionId === q.id)?.answer;
          const isMultiple = q.type === 'multiple';
          const isSingle = q.type === 'single' || q.type === 'image';
          const isDrag = q.type === 'dragdrop';

          return (
            <div key={q.id} ref={(el) => { questionRefs.current[index] = el; }}>
              <Card className="mb-6">
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Question {index + 1}</h2>
                  <p>{q.text}</p>

                  {isSingle && (
                    <div className="space-y-1">
                      {(q.options || []).map((opt: string) => {
                        const isCorrect = (q.correctAnswers || []).includes(opt);
                        const isSelected = userAns === opt;
                        // selected correct -> green, selected wrong -> red, correct but not selected -> subtle outline
                        const baseClass = isSelected && isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : isSelected && !isCorrect
                            ? 'bg-red-50 border border-red-200'
                            : isCorrect
                              ? 'bg-white border border-green-100'
                              : 'bg-white';

                        return (
                          <div key={opt} className={`p-2 rounded flex items-center justify-between ${baseClass}`}>
                            <div className="text-sm">{opt}</div>
                            <div className="text-xs">
                              {isSelected && isCorrect && <span className="text-green-700">Your answer (Correct)</span>}
                              {isSelected && !isCorrect && <span className="text-red-700">Your answer (Wrong)</span>}
                              {!isSelected && isCorrect && <span className="text-green-700">Correct answer</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isMultiple && (
                    <div className="space-y-1">
                      {(q.options || []).map((opt: string) => {
                        const isCorrect = (q.correctAnswers || []).includes(opt);
                        const isSelected = Array.isArray(userAns) && userAns.includes(opt);
                        // selected correct -> green, selected wrong -> red, correct but unselected -> subtle outline
                        const baseClass = isSelected && isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : isSelected && !isCorrect
                            ? 'bg-red-50 border border-red-200'
                            : isCorrect
                              ? 'bg-white border border-green-100'
                              : 'bg-white';

                        return (
                          <div key={opt} className={`p-2 rounded flex items-center justify-between ${baseClass}`}>
                            <div className="text-sm">{opt}</div>
                            <div className="text-xs">
                              {isSelected && isCorrect && <span className="text-green-700">Selected (Correct)</span>}
                              {isSelected && !isCorrect && <span className="text-red-700">Selected (Wrong)</span>}
                              {!isSelected && isCorrect && <span className="text-green-700">Correct answer</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isDrag && (
                    <div>
                      <div className="text-sm mb-2">Slots:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Array.from({ length: q.slotCount || (q.correctAnswers || []).length }).map((_, sidx) => {
                          const correctVal = (q.correctAnswers || [])[sidx];
                          const userVal = Array.isArray(userAns) ? userAns[sidx] : null;
                          const correct = userVal === correctVal;
                          return (
                            <div key={sidx} className={`p-2 rounded ${correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className="text-sm">Slot {sidx + 1}</div>
                              <div className="text-xs">Your: {userVal ?? '(empty)'}</div>
                              <div className="text-xs">Answer: {correctVal}</div>
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
            <Card className="mb-6">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold">Question {index + 1}</h2>
                <p>{q.text}</p>

                {renderQuestion(q, (ans) => handleAnswered(q.id, ans), locked)}

              </CardContent>
            </Card>
          </div>
        ))
      )}
    </main>
  );
}
