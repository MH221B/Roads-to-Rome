import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { FiCheckCircle, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import api from '@/services/axiosClient';
import { useAuth } from '@/contexts/AuthProvider';
import { decodeJwtPayload } from '@/lib/utils';

type QuizQuestion = {
  _id?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
};

type QuizData = {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
};

type AnswerForm = {
  answers: { answer: string }[]; // form representation stores selected option as `answer` value (e.g. 'A')
};

type QuizResult = {
  score: number;
  correctCount: number;
  total: number;
  highestScore?: number;
  message?: string;
  answers: Array<{
    question: string;
    selectedOption: string | null;
    correct: boolean;
    correctAnswer?: string;
    explanation?: string;
  }>;
};

type SubmitResponse = {
  quizResult: QuizResult;
  latestSubmission?: {
    latestScore?: number;
    highestScore?: number;
    answers?: QuizResult['answers'];
  };
};

type AnswerFieldName = `answers.${number}.answer`;

async function fetchQuiz(quizId: string): Promise<QuizData> {
  const res = await api.get(`/api/quizzes/${quizId}`);
  const payload = res.data;
  const questions: QuizQuestion[] = Array.isArray(payload?.questions) ? payload.questions : [];
  return {
    id: String(payload?.id ?? payload?._id ?? quizId),
    title: payload?.title ?? 'Quiz',
    description: payload?.description ?? '',
    questions,
  };
}

async function submitQuiz(
  quizId: string,
  userId: string,
  answers: Array<{ question: string; selectedOption: string | null }>
): Promise<SubmitResponse> {
  const res = await api.post(`/api/quizzes/${quizId}/submit`, {
    answers: answers,
    userId: userId,
  });
  return res.data ?? {};
}

export default function Quiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const auth = useAuth();
  const [userId, setUserId] = useState<string>('');
  const [grading, setGrading] = useState<
    Record<
      string,
      {
        correct: boolean;
        selected: string;
        correctAnswer?: string;
        explanation?: string;
      }
    >
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [serverScore, setServerScore] = useState<number | undefined>(undefined);
  const [serverHighScore, setServerHighScore] = useState<number | undefined>(undefined);
  const [serverTotal, setServerTotal] = useState<number | undefined>(undefined);

  const quizQuery = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => fetchQuiz(quizId ?? ''),
    enabled: !!quizId,
  });

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AnswerForm>({ defaultValues: { answers: [] } });
  const quizData = quizQuery.data;
  const answers = watch('answers') ?? [];
  const answeredCount = answers.filter((a) => !!a?.answer).length;
  const accessToken = auth.accessToken;
  const authUser = (auth as any).user;

  useEffect(() => {
    if (quizData?.questions?.length) {
      reset({ answers: quizData.questions.map(() => ({ answer: '' })) });
    }
  }, [quizData, reset]); // only reset when quizData changes

  const getUserId = useCallback(() => {
    const payload = decodeJwtPayload(accessToken);
    const id = payload.userId;
    if (id) return String(id);
    return '';
  }, [accessToken]);

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, [auth, accessToken, authUser, getUserId]);

  const answerMutation = useMutation({
    mutationFn: (payload: {
      quizId: string;
      userId?: string | null;
      answers: Array<{ question: string; selectedOption: string | null }>;
    }) => submitQuiz(payload.quizId, userId, payload.answers),
    onSuccess: (res) => {
      const raw = res as SubmitResponse;
      const quizResult = raw?.quizResult;
      if (!quizResult) {
        Swal.fire({
          icon: 'error',
          title: 'Submit failed',
          text: 'Missing quiz result from server',
        });
        return;
      }

      const gradingMap: Record<
        string,
        { correct: boolean; selected: string; correctAnswer?: string; explanation?: string }
      > = {};
      (quizResult.answers ?? []).forEach((a) => {
        const qKey = String(a.question);
        gradingMap[qKey] = {
          correct: a.correct,
          selected: a.selectedOption ?? '',
          correctAnswer: a.correctAnswer,
          explanation: a.explanation,
        };
      });

      setGrading(gradingMap);
      setSubmitted(true);
      setServerScore(raw.latestSubmission?.latestScore ?? quizResult.score);
      setServerHighScore(
        raw.latestSubmission?.highestScore ?? quizResult.highestScore ?? quizResult.score
      );
      setServerTotal(quizResult.total);

      const message = quizResult.message ?? `You scored ${quizResult.score}/${quizResult.total}`;
      if (message) {
        Swal.fire({ icon: 'success', title: 'Quiz submitted', text: message });
      }
    },
    onError: (err: any) => {
      Swal.fire({ icon: 'error', title: 'Submit failed', text: err?.message ?? 'Try again' });
    },
  });

  const onSubmit = (data: AnswerForm) => {
    if (submitted) return;
    const quiz = quizData;
    if (!quizId || !quiz) return;
    const payloadAnswers = quiz.questions.map((q, idx) => ({
      question: q.question,
      selectedOption: data.answers?.[idx]?.answer ?? null,
    }));

    const missing = payloadAnswers.some((a) => !a.selectedOption);
    if (missing) {
      Swal.fire({ icon: 'warning', title: 'Answer all questions' });
      return;
    }
    answerMutation.mutate({ quizId, userId, answers: payloadAnswers });
  };

  const gradedStats = useMemo(() => {
    if (typeof serverScore === 'number' && typeof serverTotal === 'number') {
      const total = serverTotal;
      const correct = serverScore;
      return {
        total,
        correct,
        percent: total ? Math.round((correct / total) * 100) : 0,
      };
    }
    return null;
  }, [serverScore, serverTotal]);

  if (quizQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (quizQuery.error || !quizQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-center text-sm">
          Unable to load quiz.{' '}
          <Button
            variant="link"
            className="inline-flex items-center gap-2"
            onClick={() => quizQuery.refetch()}
          >
            <FiRefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const quiz = quizData ?? { id: quizId ?? 'unknown', title: 'Quiz', questions: [] };

  return (
    <div className="bg-muted/30 min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-muted-foreground mt-1 text-sm">{quiz.description}</p>
            )}
          </div>
          <div className="text-muted-foreground text-sm">
            {answeredCount}/{quiz.questions.length} answered
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Select one answer per question.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(grading).length > 0 && gradedStats && (
              <div className="rounded-lg border bg-white/70 px-4 py-3 text-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Results</div>
                  <div className="text-muted-foreground space-y-1 text-right">
                    <div>
                      Current: {gradedStats.correct}/{gradedStats.total} · {gradedStats.percent}%
                    </div>
                    {typeof serverHighScore === 'number' && typeof serverTotal === 'number' && (
                      <div className="text-xs">
                        High score: {serverHighScore}/{serverTotal}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {quiz.questions.map((q, idx) => {
                const fieldName = `answers.${idx}.answer` as AnswerFieldName;
                const questionKey = q.question;
                const graded = grading[questionKey];
                return (
                  <Card key={q._id ?? idx} className="border-muted/70">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                      <CardDescription>{q.question}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid gap-2 md:grid-cols-2">
                        <OptionRadio
                          name={fieldName}
                          value="A"
                          label={q.optionA}
                          register={register}
                          disabled={submitted}
                        />
                        <OptionRadio
                          name={fieldName}
                          value="B"
                          label={q.optionB}
                          register={register}
                          disabled={submitted}
                        />
                        <OptionRadio
                          name={fieldName}
                          value="C"
                          label={q.optionC}
                          register={register}
                          disabled={submitted}
                        />
                        <OptionRadio
                          name={fieldName}
                          value="D"
                          label={q.optionD}
                          register={register}
                          disabled={submitted}
                        />
                      </div>
                      {graded && (
                        <div
                          className={`flex items-start gap-2 rounded-md ${graded.correct ? 'bg-emerald-50' : 'bg-destructive/10'} px-3 py-2 text-sm`}
                        >
                          {graded.correct ? (
                            <FiCheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                          ) : (
                            <FiXCircle className="text-destructive mt-0.5 h-4 w-4" />
                          )}
                          <div className="space-y-1">
                            <div className="font-medium">
                              {graded.correct ? 'Correct' : 'Incorrect'}
                            </div>
                            {graded.correctAnswer && (
                              <div className="text-muted-foreground text-xs">
                                Correct answer: {graded.correctAnswer}
                              </div>
                            )}
                            {graded.selected && (
                              <div className="text-muted-foreground text-xs">
                                Your answer: {graded.selected}
                              </div>
                            )}
                            {graded.explanation && (
                              <div className="text-muted-foreground text-xs">
                                {graded.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => reset({ answers: quiz.questions.map(() => ({ answer: '' })) })}
                  disabled={submitted}
                >
                  Clear answers
                </Button>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={submitted || answerMutation.isPending || isSubmitting}
                >
                  {submitted ? (
                    <span>Submitted</span>
                  ) : answerMutation.isPending || isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <FiCheckCircle className="h-4 w-4" />
                  )}
                  {!submitted && ' Submit quiz'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OptionRadio({
  name,
  value,
  label,
  register,
  disabled,
}: {
  name: AnswerFieldName;
  value: string;
  label: string;
  register: UseFormRegister<AnswerForm>;
  disabled?: boolean;
}) {
  return (
    <label className="hover:border-primary flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm transition">
      <input
        type="radio"
        value={value}
        {...register(name, { required: true })}
        disabled={disabled}
        className="mt-1 h-4 w-4"
      />
      <div className="flex-1">
        <div className="font-medium">{value}</div>
        <div className="text-muted-foreground text-xs">{label}</div>
      </div>
    </label>
  );
}
