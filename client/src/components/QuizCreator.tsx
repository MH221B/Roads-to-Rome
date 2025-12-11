import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { FiPlus, FiTrash2, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
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
import { getCourses, type Course } from '@/services/courseService';

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

async function fetchLessons(courseId: string): Promise<Lesson[]> {
  if (!courseId) return [];
  // server exposes lessons under /api/courses/:courseId/lessons
  const response = await api.get(`/api/courses/${courseId}/lessons`);
  const payload = response.data;
  if (Array.isArray(payload)) return payload as Lesson[];
  if (Array.isArray(payload?.data)) return payload.data as Lesson[];
  return [];
}

async function createQuiz(payload: QuizFormValues) {
  // server expects quiz schema with id, lesson_id, questions array etc.
  const genId = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `quiz_${Date.now()}`;
  const quizPayload: any = {
    id: genId,
    lesson_id: payload.lessonId ?? '',
    course_id: payload.courseId,
    title: payload.title,
    description: payload.description,
    timelimit: payload.timelimit,
    order: payload.order ?? 1,
    questions: (payload.questions || []).map((q: QuizQuestion, index: number) => {
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
  };
  const res = await api.post('/api/quiz', quizPayload);
  return res.data;
}

export default function QuizCreator() {
  const queryClient = useQueryClient();

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
      questions: [
        {
          question: '',
          type: 'single',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
          multiCorrect: [],
          slotCount: 1,
          explanation: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  const coursesQuery = useQuery({
    queryKey: ['quiz-courses'],
    queryFn: () => getCourses(1, 50),
  });

  const courseId = watch('courseId');
  const targetType = watch('targetType');

  const lessonsQuery = useQuery({
    queryKey: ['quiz-lessons', courseId],
    queryFn: () => fetchLessons(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createQuiz,
    onSuccess: () => {
      Swal.fire({ icon: 'success', title: 'Quiz created', timer: 1800, showConfirmButton: false });
      reset();
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (err: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Failed to create quiz',
        text: err?.message ?? 'Unexpected error',
      });
    },
  });

  useEffect(() => {
    // Clear lesson selection if user switches to course-only target
    if (targetType === 'course') {
      setValue('lessonId', '');
    }
  }, [targetType, setValue]);

  const onSubmit = (data: QuizFormValues) => {
    if (!data.courseId) {
      Swal.fire({ icon: 'warning', title: 'Pick a course first' });
      return;
    }
    if (data.targetType === 'lesson' && !data.lessonId) {
      Swal.fire({ icon: 'warning', title: 'Select a lesson for this quiz' });
      return;
    }
    // Prefer a lessonId when available; the server expects `lesson_id` but an empty
    // value is acceptable when a course has no lessons.
    let selectedLessonId = data.lessonId;
    if (data.targetType === 'course') {
      // If the course has lessons, prefer the first lesson as the attached lesson id.
      // Otherwise allow creating a quiz attached to the course with no lesson (lessonId remains undefined).
      if (lessonsQuery.data && lessonsQuery.data.length > 0) {
        selectedLessonId = lessonsQuery.data[0]._id;
      }
    }
    const sanitized: QuizFormValues = { ...data, lessonId: selectedLessonId };
    createMutation.mutate(sanitized);
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      <HeaderComponent />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quiz Creator</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Attach quizzes to a course or a lesson and add MCQ questions (A/B/C/D).
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              coursesQuery.refetch();
              if (courseId) lessonsQuery.refetch();
            }}
            className="gap-2"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh lists
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create quiz</CardTitle>
            <CardDescription>Fill quiz meta and add as many MCQ items as you need.</CardDescription>
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
                      <SelectValue placeholder="Select course" />
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
                          targetType === 'course' ? 'Attach to course only' : 'Select lesson'
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
                    </SelectContent>
                  </Select>
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
                          <CardDescription>MCQ with four options</CardDescription>
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
                <Button type="button" variant="ghost" onClick={() => reset()}>
                  Reset form
                </Button>
                <Button
                  type="submit"
                  className="gap-2"
                  disabled={createMutation.isPending || isSubmitting}
                >
                  {createMutation.isPending || isSubmitting ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <FiCheckCircle className="h-4 w-4" />
                  )}{' '}
                  Create quiz
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}