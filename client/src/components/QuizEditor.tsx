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
import HeaderComponent from '@/components/HeaderComponent';
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
  // for multiple choice questions (type === 'multiple') this holds selected letters
  multiCorrect?: ('A' | 'B' | 'C' | 'D')[];
  type?: 'single' | 'multiple' | 'image' | 'dragdrop';
  slotCount?: number;
  explanation?: string;
  id?: string;
};

type QuizFormValues = {
  title: string;
  targetType: QuizTarget;
  courseId: string;
  lessonId?: string;
  questions: QuizQuestion[];
  description?: string;
  timelimit?: number;
  order?: number;
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
  type: 'single',
  multiCorrect: [],
  slotCount: 1,
  explanation: '',
});

async function fetchLessons(courseId: string): Promise<Lesson[]> {
  if (!courseId) return [];
  // server exposes lessons under /api/courses/:courseId/lessons
  const res = await api.get(`/api/courses/${courseId}/lessons`);
  const payload = res.data;
  if (Array.isArray(payload)) return payload as Lesson[];
  if (Array.isArray(payload?.data)) return payload.data as Lesson[];
  return [];
}

function adaptQuestion(raw: any): QuizQuestion {
  const options = Array.isArray(raw?.options) ? raw.options : [];
  // server stores prompt in `text` and correct answers as array under `correctAnswers`
  const correctArr = Array.isArray(raw?.correctAnswers) ? raw.correctAnswers : [];
  const optionMap = ['A', 'B', 'C', 'D'] as const;
  // if multiple correct answers, set multiCorrect; otherwise derive single correct letter
  let correctLetter: 'A' | 'B' | 'C' | 'D' = 'A';
  const multiCorrect: ('A' | 'B' | 'C' | 'D')[] = [];
  if (correctArr.length > 1) {
    correctArr.forEach((val: string) => {
      const idx = options.indexOf(val);
      if (idx >= 0 && idx < 4) multiCorrect.push(optionMap[idx]);
    });
  } else if (correctArr.length === 1) {
    const correct = correctArr[0];
    const correctIndex = options.indexOf(correct);
    if (correctIndex >= 0 && correctIndex < 4) correctLetter = optionMap[correctIndex];
  }
  return {
    id: raw?.id ?? raw?._id ?? undefined,
    question: raw?.text ?? '',
    optionA: options[0] ?? '',
    optionB: options[1] ?? '',
    optionC: options[2] ?? '',
    optionD: options[3] ?? '',
    correctAnswer: correctLetter,
    multiCorrect: multiCorrect,
    type: raw?.type ?? 'single',
    slotCount: raw?.slotCount ?? undefined,
    explanation: raw?.explanation ?? '',
  };
}

async function fetchQuiz(quizId: string): Promise<QuizResponse> {
  const res = await api.get(`/api/quiz/${quizId}`);
  const payload = res.data ?? {};
  const rawQuestions = Array.isArray(payload?.questions) ? payload.questions : [];
  const questions = rawQuestions.length ? rawQuestions.map(adaptQuestion) : [blankQuestion()];

  return {
    id: String(payload?.id ?? payload?._id ?? quizId),
    title: payload?.title ?? '',
    // targetType is a frontend concept; we infer it from lesson_id presence
    targetType: payload?.lesson_id ? 'lesson' : 'course',
    // server stores lesson reference under `lesson_id` and may store `course_id`; frontend uses `courseId` in the form
    courseId: payload?.course_id ?? '',
    lessonId: payload?.lesson_id ? String(payload.lesson_id) : undefined,
    description: payload?.description ?? '',
    timelimit: payload?.timelimit ?? undefined,
    order: payload?.order ?? 1,
    questions,
  };
}

async function updateQuiz(quizId: string, payload: QuizFormValues) {
  // Build payload aligned with the server model (lesson_id, questions[].text/options/correctAnswers).
  // If the quiz is attached to a course, pick the first lesson of the chosen course as fallback.
  let lessonId = payload.targetType === 'lesson' ? payload.lessonId : undefined;
  if (!lessonId && payload.courseId) {
    const fetched = await fetchLessons(payload.courseId);
    if (fetched && fetched.length) lessonId = fetched[0]._id;
  }
  const res = await api.put(`/api/quiz/${quizId}`, {
    title: payload.title,
    description: payload.description,
    timelimit: payload.timelimit,
    order: payload.order ?? 1,
    // If no lesson is found/selected, send an empty string so the server receives a clear value
    lesson_id: lessonId ?? '',
    course_id: payload.courseId,
    questions: payload.questions.map((q: QuizQuestion, index: number) => {
      const qId = q.id ?? (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `q_${Date.now()}_${index}`);
      const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean);
      const type = q.type ?? 'single';
      let corectAnswers: string[] = [];
      if (type === 'single') {
        const letterIndex = { A: 0, B: 1, C: 2, D: 3 }[q.correctAnswer];
        corectAnswers = options[letterIndex] ? [options[letterIndex]] : [];
      } else if (type === 'multiple') {
        const selected = q.multiCorrect || [];
        corectAnswers = selected.map((letter) => {
          const idx = { A: 0, B: 1, C: 2, D: 3 }[letter];
          return options[idx];
        }).filter(Boolean);
      } else if (type === 'dragdrop') {
        corectAnswers = options.slice(0, q.slotCount ?? options.length);
      }
      return {
        id: qId,
        type: type,
        text: q.question,
        options,
        slotCount: q.slotCount,
        correctAnswers: corectAnswers,
      };
    }),
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
      description: '',
      timelimit: undefined,
      order: 1,
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

// quiz db doesn't have course ID so skip this check for now
  // useEffect(() => {
  //   if (!quizQuery.data || !coursesQuery.data || !quizQuery.data.courseId) return;
  //   const quiz = quizQuery.data;
  //   const courses = coursesQuery.data;
  //   const course = courses.find((c: { id: string; }) => c.id === quiz.courseId);
  //   if (instructorId != course?.instructor) {
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Unauthorized',
  //       text: 'You do not have permission to edit this quiz.',
  //     })
  //     .then(() => {
  //       window.location.href = '/dashboard'; // Redirect to dashboard or another appropriate page
  //     });
  //   }
  //   // Ensure the form value for courseId is set to the quiz' course ID so lessonsQuery becomes enabled
  //   setValue('courseId', quiz.courseId);
  // }, [quizQuery.data, coursesQuery.data, instructorId, setValue]);

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

  // If we have a quiz attached to a lesson, derive and set courseId by searching instructor's courses.
  useEffect(() => {
    const lessonId = quizQuery.data?.lessonId;
    if (!lessonId) return;
    if (courseId) return; // course already selected
    if (!coursesQuery.data || coursesQuery.isLoading) return; // wait for courses

    let cancelled = false;
    (async () => {
      for (const c of coursesQuery.data) {
        if (cancelled) break;
        try {
          const lessons = await fetchLessons(c.id);
          if (lessons.find((l) => l._id === lessonId)) {
            setValue('courseId', c.id);
            break;
          }
        } catch (err) {
          // ignore per-course fetch error
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizQuery.data?.lessonId, coursesQuery.data, coursesQuery.isLoading, courseId, setValue]);

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

    if (data.targetType === 'course') {
      // Attaching to course is allowed even if the course has no lessons.
      // If there are lessons, update logic will use the first lesson as fallback when needed.
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
    <div className="bg-muted/30 min-h-screen">
      <HeaderComponent />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
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

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    rows={2}
                    className="bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
                    {...register('description' as any)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time limit (seconds)</Label>
                  <Input type="number" {...register('timelimit' as any)} />
                </div>
                <div className="space-y-2">
                  <Label>Order</Label>
                  <Input type="number" {...register('order' as any)} />
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
                        !coursesQuery.data.find((c: { id: string; }) => c.id === courseId) && (
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
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>Question type</Label>
                            <Select
                              value={watch(`questions.${index}.type` as const) ?? 'single'}
                              onValueChange={(val) => setValue(`questions.${index}.type`, val as any)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="multiple">Multiple</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="dragdrop">Drag & Drop</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {watch(`questions.${index}.type` as any) === 'dragdrop' && (
                            <div className="space-y-1">
                              <Label>Slot count</Label>
                              <Input
                                type="number"
                                min={1}
                                {...register(`questions.${index}.slotCount` as const)}
                              />
                            </div>
                          )}
                        </div>
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
                          {watch(`questions.${index}.type` as any) === 'single' && (
                            <Select
                              value={watch(`questions.${index}.correctAnswer` as const)}
                              onValueChange={(val) =>
                                setValue(`questions.${index}.correctAnswer`, val as 'A' | 'B' | 'C' | 'D')
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
                          )}
                          {watch(`questions.${index}.type` as any) === 'multiple' && (
                            <div className="flex gap-4 mt-2 items-center">
                              {(['A', 'B', 'C', 'D'] as const).map((letter) => (
                                <label key={letter} className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={
                                      (watch(`questions.${index}.multiCorrect` as const) || []).includes(
                                        letter as any
                                      )
                                    }
                                    onChange={(e) => {
                                      const arr = [...(watch(`questions.${index}.multiCorrect` as const) || [])];
                                      if (e.currentTarget.checked) arr.push(letter as any);
                                      else {
                                        const idx = arr.indexOf(letter as any);
                                        if (idx > -1) arr.splice(idx, 1);
                                      }
                                      setValue(`questions.${index}.multiCorrect`, arr);
                                    }}
                                  />
                                  <span className="text-xs">{letter}</span>
                                </label>
                              ))}
                            </div>
                          )}
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