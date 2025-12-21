import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { uploadFile, createLesson, getLessonsByCourse } from '@/services/lessonService';
import LessonForm, { type LessonFormValues } from '@/components/LessonForm';

export default function CreateLesson() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch existing lessons to calculate next order
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons', courseId],
    queryFn: () => (courseId ? getLessonsByCourse(courseId) : Promise.resolve([])),
    enabled: !!courseId,
  });

  // Calculate next order number
  const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.order || 0)) + 1 : 0;

  const createMutation = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      if (!courseId) throw new Error('Missing courseId');

      const payload: any = {
        title: data.title,
        lessonType: data.lessonType,
        order: nextOrder,
        content_type: 'html',
        content: data.htmlContent,
      };

      // If a video is uploaded, set it as video content
      if (data.videoFile) {
        const uploadRes = await uploadFile(data.videoFile);
        payload.content_type = 'video';
        payload.content = uploadRes?.url ?? null;
      }

      // Upload attachments and collect their URLs
      if (data.attachmentFiles.length > 0) {
        const attachmentUrls = await Promise.all(
          data.attachmentFiles.map((file) => uploadFile(file).then((res) => res?.url))
        );
        payload.attachments = attachmentUrls;
      }

      return await createLesson(courseId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      Swal.fire({
        title: 'Success!',
        text: 'Lesson created successfully.',
        icon: 'success',
        confirmButtonText: 'Great!',
        confirmButtonColor: '#10b981',
      }).then(() => {
        navigate(`/courses/${courseId}`);
      });
    },
    onError: (error: any) => {
      console.error('Failed to create lesson', error);
      const msg =
        error?.response?.data?.error ??
        error?.message ??
        'Failed to create lesson. Please try again.';
      Swal.fire({
        title: 'Error!',
        text: msg,
        icon: 'error',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#ef4444',
      });
    },
  });

  return (
    <LessonForm
      onSubmit={(data) => createMutation.mutate(data)}
      isLoading={createMutation.isPending}
      onCancel={() => navigate(`/courses/${courseId}`)}
    />
  );
}
