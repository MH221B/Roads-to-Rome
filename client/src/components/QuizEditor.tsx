import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { FiCheckCircle, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import api from '@/services/axiosClient';
import { getCoursesByInstructor, type Course } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthProvider';
import { decodeJwtPayload } from '@/lib/utils';

type QuizTarget = 'course' | 'lesson';

type QuizQuestion = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
};

type QuizFormValues = {
  title: string;
  targetType: QuizTarget;
  courseId: string;
  lessonId?: string;
  questions: QuizQuestion[];
};

type Lesson = {
  _id: string;
  title: string;
};

type QuizResponse = QuizFormValues & { id: string };

const blankQuestion = (): QuizQuestion => ({
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  explanation: '',
});

async function fetchLessons(courseId: string): Promise<Lesson[]> {
  if (!courseId) return [];
  const res = await api.get(`/api/lessons/course/${courseId}`);
  const payload = res.data;
  if (Array.isArray(payload)) return payload as Lesson[];
  if (Array.isArray(payload?.data)) return payload.data as Lesson[];
  return [];
}

function adaptQuestion(raw: any): QuizQuestion {
  const options = Array.isArray(raw?.options) ? raw.options : [];
  return {
    question: raw?.question ?? '',
    optionA: raw?.optionA ?? options[0] ?? '',
    optionB: raw?.optionB ?? options[1] ?? '',
    optionC: raw?.optionC ?? options[2] ?? '',
    optionD: raw?.optionD ?? options[3] ?? '',
    correctAnswer: (raw?.correctAnswer ?? 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: raw?.explanation ?? '',
  };
}

async function fetchQuiz(quizId: string): Promise<QuizResponse> {
  const res = await api.get(`/api/quizzes/${quizId}`);
  const payload = res.data ?? {};
  const rawQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
  const questions = rawQuestions.length ? rawQuestions.map(adaptQuestion) : [blankQuestion()];

  return {
    id: String(payload?.id ?? payload?._id ?? quizId),
    title: payload?.title ?? '',
    targetType: payload?.targetType === 'lesson' ? 'lesson' : 'course',
    courseId: payload?.courseId ? String(payload.courseId) : '',
    lessonId: payload?.lessonId ? String(payload.lessonId) : '',
    questions,
  };
}

async function updateQuiz(quizId: string, payload: QuizFormValues) {
  const res = await api.put(`/api/quizzes/${quizId}`, {
    title: payload.title,
    targetType: payload.targetType,
    courseId: payload.courseId,
    lessonId: payload.targetType === 'lesson' ? payload.lessonId : undefined,
    questions: payload.questions.map((q) => ({
      question: q.question,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
    })),
  });
  return res.data;
}

export default function QuizEditor() {
  // Support both '/quizzes/:id/edit' and '/quizzes/:quizId' param shapes
  const params = useParams<{ id?: string; quizId?: string }>();
  const quizId = params.quizId ?? params.id ?? '';
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const instructorId = useMemo(() => {
    const payload = decodeJwtPayload(accessToken);
    const id = payload?.userId ?? '';
    return id ? String(id) : '';
  }, [accessToken]);
  // remove direct DOM manipulation and rely on controlled form state (setValue)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    register,
    formState: { isSubmitting },
  } = useForm<QuizFormValues>({
    defaultValues: {
      title: '',
      targetType: 'course',
      courseId: '',
      lessonId: '',
      questions: [blankQuestion()],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  const courseId = watch('courseId');
  const targetType = watch('targetType');

  const quizQuery = useQuery({
    queryKey: ['quiz-detail', quizId],
    queryFn: () => fetchQuiz(quizId ?? ''),
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000,
  });

  // Use effectiveCourseId to fetch lessons immediately when quiz data loads,
  // instead of waiting for the form to reset.
  const effectiveCourseId = courseId || quizQuery.data?.courseId || '';

  const coursesQuery = useQuery({
    queryKey: ['quiz-courses', instructorId],
    queryFn: () => getCoursesByInstructor(instructorId),
    enabled: !!instructorId,
  });

  const lessonsQuery = useQuery({
    queryKey: ['quiz-lessons', effectiveCourseId],
    queryFn: () => fetchLessons(effectiveCourseId),
    enabled: !!effectiveCourseId && targetType === 'lesson',
    staleTime: 5 * 60 * 1000,
  });

  // Debugging removed: previously logged query states for development troubleshooting.

  useEffect(() => {
    if (!quizQuery.data || !coursesQuery.data || !quizQuery.data.courseId) return;
    const quiz = quizQuery.data;
    const courses = coursesQuery.data;
    // debugging removed: do not print course lists in production
    const course = courses.find((c) => c.id === quiz.courseId);
    // debugging removed: do not print found course in production
    if (instructorId != course?.instructor) {
      // debugging removed: do not log instructor IDs
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'You do not have permission to edit this quiz.',
      });
      // .then(() => {
      //   window.location.href = '/dashboard'; // Redirect to dashboard or another appropriate page
      // });
    }
    // Ensure the form value for courseId is set to the quiz' course ID so lessonsQuery becomes enabled
    setValue('courseId', quiz.courseId);
  }, [quizQuery.data, coursesQuery.data, instructorId, setValue]);

  useEffect(() => {
    if (!quizQuery.data) return;
    const data = quizQuery.data;
    reset({
      title: data.title,
      targetType: data.targetType,
      courseId: data.courseId,
      lessonId: data.lessonId ?? '',
      questions: data.questions?.length ? data.questions : [blankQuestion()],
    });
  }, [quizQuery.data, reset]);

  useEffect(() => {
    if (targetType === 'course') {
      setValue('lessonId', '');
    }
  }, [targetType, setValue]);

  // When the instructor loads a list of courses and no course is selected (creating new quiz),
  // choose the first course as default so lessons load automatically.
  useEffect(() => {
    if (coursesQuery.isSuccess && !courseId && coursesQuery.data?.length) {
      setValue('courseId', coursesQuery.data[0].id);
    }
  }, [coursesQuery.isSuccess, coursesQuery.data, courseId, setValue]);

  const updateMutation = useMutation({
    mutationFn: (payload: QuizFormValues) => updateQuiz(quizId ?? '', payload),
    onSuccess: () => {
      Swal.fire({ icon: 'success', title: 'Quiz updated', timer: 1800, showConfirmButton: false });
      queryClient.invalidateQueries({ queryKey: ['quiz-detail', quizId] });
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (err: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed to update quiz',
        text: err?.message ?? 'Unexpected error',
      });
    },
  });

  const onSubmit = (data: QuizFormValues) => {
    if (!quizId) {
      Swal.fire({ icon: 'error', title: 'Missing quiz id' });
      return;
    }
    if (!data.courseId) {
      Swal.fire({ icon: 'warning', title: 'Pick a course first' });
      return;
    }
    if (data.targetType === 'lesson' && !data.lessonId) {
      Swal.fire({ icon: 'warning', title: 'Select a lesson for this quiz' });
      return;
    }

    const sanitized: QuizFormValues = {
      ...data,
      lessonId: data.targetType === 'lesson' ? data.lessonId : undefined,
    };
    updateMutation.mutate(sanitized);
  };

  const needToLoadCourses = !!instructorId;
  const initialLoading = quizQuery.isLoading || (needToLoadCourses && coursesQuery.isLoading);

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }
  const failedLoad = Boolean(quizQuery.error || !quizQuery.data);
  const courseLoadFailed = Boolean(needToLoadCourses && (coursesQuery.error || !coursesQuery.data));
  const lessonLoadFailed = Boolean(effectiveCourseId && (lessonsQuery.error || !lessonsQuery.data));

  if (failedLoad) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-center text-sm">
          Unable to load quiz.
          {quizQuery.error && (
            <div className="text-muted-foreground mt-2 text-xs">
              {String(quizQuery.error?.message ?? quizQuery.error)}
            </div>
          )}
          <Button
            variant="link"
            className="inline-flex items-center gap-2"
            onClick={() => {
              quizQuery.refetch();
              if (needToLoadCourses) coursesQuery.refetch();
            }}
          >
            <FiRefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  const quiz = quizQuery.data!;

  return (
    <div className="bg-muted/30 min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quiz Editor</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Editing: {quiz.title || 'Untitled quiz'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              quizQuery.refetch();
              coursesQuery.refetch();
              if (courseId) lessonsQuery.refetch();
            }}
            className="gap-2"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh data
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Update quiz</CardTitle>
            <CardDescription>Review current values, tweak them, and save.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Arrays fundamentals"
                    {...register('title', { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Attach to</Label>
                  <Select
                    value={targetType}
                    onValueChange={(val) => setValue('targetType', val as QuizTarget)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="lesson">Lesson</SelectItem>
                    </SelectContent>
                  </Select>
                  {courseLoadFailed && (
                    <div className="flex items-start gap-2 pt-2">
                      <p className="text-destructive text-xs">Unable to load your courses.</p>
                      <Button
                        variant="link"
                        className="text-xs"
                        onClick={() => coursesQuery.refetch()}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select value={courseId} onValueChange={(val) => setValue('courseId', val)}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={coursesQuery.isLoading ? 'Loading...' : 'Select course'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesQuery.isLoading && (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {coursesQuery.data?.length === 0 && !coursesQuery.isLoading && (
                        <SelectItem value="none" disabled>
                          No courses found
                        </SelectItem>
                      )}
                      {coursesQuery.data?.map((course: Course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                      {!coursesQuery.isLoading &&
                        courseId &&
                        coursesQuery.data &&
                        !coursesQuery.data.find((c) => c.id === courseId) && (
                          <SelectItem value={courseId}>Current course (not in list)</SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lesson (optional)</Label>
                  <Select
                    value={watch('lessonId') ?? ''}
                    onValueChange={(val) => setValue('lessonId', val)}
                    disabled={targetType === 'course' || !courseId || lessonsQuery.isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          targetType === 'course' ? 'Attached to course only' : 'Select lesson'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {lessonsQuery.isLoading && (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {!lessonsQuery.isLoading && lessonsQuery.data?.length === 0 && (
                        <SelectItem value="none" disabled>
                          No lessons found
                        </SelectItem>
                      )}
                      {lessonsQuery.data?.map((lesson) => (
                        <SelectItem key={lesson._id} value={lesson._id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                      {!lessonsQuery.isLoading &&
                        watch('lessonId') &&
                        !lessonsQuery.data?.find((l) => l._id === watch('lessonId')) && (
                          <SelectItem value={watch('lessonId') as string}>
                            Current lesson (not in list)
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                  {lessonLoadFailed && (
                    <div className="flex items-start gap-2 pt-2">
                      <p className="text-destructive text-xs">
                        Unable to load lessons for this course.
                      </p>
                      <Button
                        variant="link"
                        className="text-xs"
                        onClick={() => lessonsQuery.refetch()}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                  {targetType === 'lesson' && !courseId && (
                    <p className="text-destructive text-xs">
                      Select a course first to load lessons.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Questions</h2>
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() =>
                      append({
                        question: '',
                        optionA: '',
                        optionB: '',
                        optionC: '',
                        optionD: '',
                        correctAnswer: 'A',
                        explanation: '',
                      })
                    }
                  >
                    <FiPlus className="h-4 w-4" /> Add question
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-muted/70">
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div>
                          <CardTitle className="text-base">Question {index + 1}</CardTitle>
                          <CardDescription>
                            Existing values are pre-filled for review.
                          </CardDescription>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          aria-label="Remove question"
                          disabled={fields.length === 1}
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label>Prompt</Label>
                          <Input
                            placeholder="Type the question"
                            {...register(`questions.${index}.question` as const, {
                              required: true,
                            })}
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Option A</Label>
                            <Input
                              {...register(`questions.${index}.optionA` as const, {
                                required: true,
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Option B</Label>
                            <Input
                              {...register(`questions.${index}.optionB` as const, {
                                required: true,
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Option C</Label>
                            <Input
                              {...register(`questions.${index}.optionC` as const, {
                                required: true,
                              })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Option D</Label>
                            <Input
                              {...register(`questions.${index}.optionD` as const, {
                                required: true,
                              })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label>Correct answer</Label>
                          <Select
                            value={watch(`questions.${index}.correctAnswer` as const)}
                            onValueChange={(val) =>
                              setValue(
                                `questions.${index}.correctAnswer`,
                                val as 'A' | 'B' | 'C' | 'D'
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">A</SelectItem>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="C">C</SelectItem>
                              <SelectItem value="D">D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label>Explanation (shown after submit)</Label>
                          <textarea
                            rows={3}
                            placeholder="Why is this answer correct?"
                            className="bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                            {...register(`questions.${index}.explanation` as const)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (quizQuery.data) {
                      reset(quizQuery.data);
                    } else {
                      reset({
                        title: '',
                        targetType: 'course',
                        courseId: '',
                        lessonId: '',
                        questions: [blankQuestion()],
                      });
                    }
                  }}
                >
                  Reset to loaded values
                </Button>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={updateMutation.isPending || isSubmitting}
                >
                  {updateMutation.isPending || isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <FiCheckCircle className="h-4 w-4" />
                  )}{' '}
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
