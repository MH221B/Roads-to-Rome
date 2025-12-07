import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';

interface Props {
  questions: any[];
  questionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  answeredQuestions: Set<string>;
  reviewMode: boolean;
  selectedAttempt: any | null;
  timeRemaining: number;
  locked: boolean;
  handleSubmit: () => void;
  openHistory: () => void;
  onRetry?: () => void;
  isSubmitting?: boolean;
  isSubmitted: boolean;
  submissionResult: any | null;
  started?: boolean;
  startQuiz?: () => void;
}

export default function QuizRight({ questions, questionRefs, answeredQuestions, reviewMode, selectedAttempt, timeRemaining, locked, handleSubmit, openHistory, onRetry, isSubmitting, isSubmitted, submissionResult, started = false, startQuiz }: Props) {
  return (
    <aside className="col-span-3 border-l p-4 flex flex-col gap-6">
      <Card className="shadow-sm">
        <CardContent className="p-4 text-center">
          {reviewMode && selectedAttempt ? (
            <>
              <h3 className="text-lg font-semibold mb-2">Score</h3>
              <div className="text-3xl font-bold">{selectedAttempt.score ?? submissionResult?.score ?? '-'} / 10</div>
            </>
          ) : (
            <>
                  <h3 className="text-lg font-semibold mb-2">Time Remaining</h3>
                  <div className="text-3xl font-bold">{Math.floor(timeRemaining/60).toString().padStart(2,'0')}:{(timeRemaining%60).toString().padStart(2,'0')}</div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-3">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              let cls = 'bg-gray-200';
              if (reviewMode && selectedAttempt) {
                const userAns = (selectedAttempt.answers || []).find((a: any) => a.questionId === q.id)?.answer;
                let correct = false;
                if (q.type === 'multiple') {
                  if (Array.isArray(userAns) && Array.isArray(q.correctAnswers)) {
                    const userSet = new Set(userAns);
                    const corrSet = new Set(q.correctAnswers);
                    correct = userAns.length === q.correctAnswers.length && [...userSet].every(x => corrSet.has(x));
                  }
                } else if (q.type === 'dragdrop') {
                  // Normalize and compare slot-by-slot. Handle nulls and trim strings to be robust.
                  if (Array.isArray(userAns) && Array.isArray(q.correctAnswers)) {
                    const userArr = userAns.map((v: any) => (v === null || typeof v === 'undefined') ? null : String(v).trim());
                    const corrArr = (q.correctAnswers as string[]).map((v: any) => String(v).trim());
                    if (userArr.length === corrArr.length) {
                      correct = userArr.every((v: any, idx: number) => v !== null && v === corrArr[idx]);
                    } else {
                      correct = false;
                    }
                  }
                } else {
                  correct = Array.isArray(q.correctAnswers) && q.correctAnswers.includes(userAns);
                }
                cls = correct ? 'bg-green-200' : 'bg-red-200';
              } else {
                cls = answeredQuestions.has(q.id) ? 'bg-green-200' : 'bg-gray-200';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => questionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className={`${cls} rounded-lg p-2 text-sm hover:bg-gray-300`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {!started && !reviewMode && (
          <Button className="mt-1 w-full bg-green-600 text-white" onClick={() => startQuiz && startQuiz()}>Start Quiz</Button>
        )}

        <Button className="mt-1 w-full bg-blue-500 text-white" onClick={() => { if (reviewMode && onRetry) { onRetry(); } else { handleSubmit(); } }} disabled={((locked && !reviewMode) || Boolean(isSubmitting) || (!started && !reviewMode))}>{reviewMode ? 'Retry Quiz' : 'Submit Quiz'}</Button>
        <Button className="mt-1 w-full" onClick={() => openHistory()}>View History</Button>
      </div>
    </aside>
  );
}
