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
import { getCourses, type Course } from '@/services/courseService';

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

async function fetchLessons(courseId: string): Promise<Lesson[]> {
  if (!courseId) return [];
  const res = await api.get(`/api/lessons/course/${courseId}`);
  const payload = res.data;
  if (Array.isArray(payload)) return payload as Lesson[];
  if (Array.isArray(payload?.data)) return payload.data as Lesson[];
  return [];
}

async function createQuiz(payload: QuizFormValues) {
  const res = await api.post('/api/quizzes', payload);
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
      questions: [
        {
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
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
    const sanitized: QuizFormValues = {
      ...data,
      lessonId: data.targetType === 'lesson' ? data.lessonId : undefined,
    };
    createMutation.mutate(sanitized);
  };

  return (
    <div className="bg-muted/30 min-h-screen px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
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
