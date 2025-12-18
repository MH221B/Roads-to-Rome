import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from './ui/button';
import { FaClock, FaTrophy, FaHistory, FaPlay, FaRedo } from 'react-icons/fa';

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
  const timeInMinutes = Math.floor(timeRemaining / 60);
  const timeInSeconds = timeRemaining % 60;
  const isTimeLow = timeRemaining < 300 && timeRemaining > 0; // Less than 5 minutes
  
  return (
    <aside className="w-80 border-l border-slate-200 bg-white p-6 flex flex-col gap-6 overflow-y-auto">
      {/* Timer or Score Card */}
      <Card className="shadow-md border-slate-200 overflow-hidden">
        <CardContent className="p-6 text-center">
          {reviewMode && selectedAttempt ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <FaTrophy className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-slate-700">Your Score</h3>
              </div>
              <div className="text-5xl font-bold text-primary mb-2">
                {selectedAttempt.score ?? submissionResult?.score ?? '-'}
              </div>
              <div className="text-sm text-slate-500">out of 10</div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                  {selectedAttempt.correctCount ?? submissionResult?.correctCount ?? 0} correct answers
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-3">
                <FaClock className={`h-5 w-5 ${isTimeLow ? 'text-red-500' : 'text-primary'}`} />
                <h3 className="text-lg font-semibold text-slate-700">Time Remaining</h3>
              </div>
              <div className={`text-5xl font-bold mb-2 ${isTimeLow ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                {timeInMinutes.toString().padStart(2, '0')}:{timeInSeconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-slate-500">
                {isTimeLow ? '⚠️ Hurry up!' : 'Keep going!'}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <Card className="shadow-md border-slate-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-900">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              let cls = 'bg-slate-200 hover:bg-slate-300 text-slate-700';
              let status = '';
              
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
                cls = correct 
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm' 
                  : 'bg-red-500 hover:bg-red-600 text-white shadow-sm';
                status = correct ? '✓' : '✗';
              } else {
                const isAnswered = answeredQuestions.has(q.id);
                cls = isAnswered 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => questionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className={`${cls} rounded-lg p-2 text-sm font-semibold transition-all duration-200 hover:scale-105 relative`}
                  title={`Question ${i + 1}${status ? ` - ${status}` : ''}`}
                >
                  {i + 1}
                  {status && <span className="absolute -top-1 -right-1 text-xs">{status}</span>}
                </button>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Answered: {answeredQuestions.size}/{questions.length}</span>
              {!reviewMode && (
                <span className="font-semibold">{Math.round((answeredQuestions.size / questions.length) * 100)}%</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {!started && !reviewMode && (
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all" 
            onClick={() => startQuiz && startQuiz()}
            size="lg"
          >
            <FaPlay className="mr-2 h-4 w-4" />
            Start Quiz
          </Button>
        )}

        <Button 
          className={`w-full font-semibold shadow-md hover:shadow-lg transition-all ${
            reviewMode 
              ? 'bg-orange-600 hover:bg-orange-700 text-white' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
          onClick={() => { if (reviewMode && onRetry) { onRetry(); } else { handleSubmit(); } }} 
          disabled={((locked && !reviewMode) || Boolean(isSubmitting) || (!started && !reviewMode))}
          size="lg"
        >
          {reviewMode ? (
            <>
              <FaRedo className="mr-2 h-4 w-4" />
              Retry Quiz
            </>
          ) : isSubmitting ? (
            'Submitting...'
          ) : (
            'Submit Quiz'
          )}
        </Button>
        
        <Button 
          className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold shadow-md hover:shadow-lg transition-all" 
          onClick={() => openHistory()}
          size="lg"
          variant="outline"
        >
          <FaHistory className="mr-2 h-4 w-4" />
          View History
        </Button>
      </div>
    </aside>
  );
}
