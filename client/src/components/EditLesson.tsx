import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { getLesson, updateLesson, uploadFile } from '@/services/lessonService';
import LessonForm from '@/components/LessonForm';
import type { LessonFormValues } from '@/components/LessonForm';

const EditLesson: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: async () => {
      if (!courseId || !lessonId) return null;
      return await getLesson(courseId, lessonId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: LessonFormValues) => {
      if (!courseId || !lessonId) throw new Error('Missing course or lesson id');

      const payload: any = {
        title: data.title,
        lessonType: data.lessonType,
      };

      // Determine content type and content
      if (data.videoFile) {
        // User uploaded a new video
        const uploadRes = await uploadFile(data.videoFile);
        payload.content_type = 'video';
        payload.content = uploadRes?.url ?? null;
      } else if (lesson?.content && lesson?.content_type === 'video') {
        // Keep existing video
        payload.content_type = 'video';
        payload.content = lesson.content;
      } else {
        // Use HTML content (either existing or updated)
        payload.content_type = 'html';
        payload.content = data.htmlContent;
      }

      // Upload new attachments and collect their URLs
      let newAttachmentUrls: string[] = [];
      if (data.attachmentFiles.length > 0) {
        newAttachmentUrls = await Promise.all(
          data.attachmentFiles.map((file) => uploadFile(file).then((res) => res?.url ?? ''))
        );
      }

      // Combine existing attachments (keep those that weren't removed) with new ones
      const existingAttachmentUrls =
        lesson?.attachments?.map((a) => a.url).filter((url) => !url.includes('blob:')) ?? [];

      if (newAttachmentUrls.length > 0 || existingAttachmentUrls.length > 0) {
        payload.attachments = [...existingAttachmentUrls, ...newAttachmentUrls];
      }

      return await updateLesson(courseId, lessonId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      Swal.fire({
        title: 'Saved',
        text: 'Lesson updated.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981',
      }).then(() => {
        navigate(`/courses/${courseId}`);
      });
    },
    onError: (err: any) => {
      console.error('Failed to update', err);
      const msg = err?.response?.data?.error ?? err?.message ?? 'Failed to update lesson.';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
      });
    },
  });

  if (isLoading) return <div className="p-6">Loading lesson...</div>;
  if (!lesson) return <div className="p-6">Lesson not found.</div>;

  const defaultValues: Partial<LessonFormValues> = {
    title: lesson.title,
    lessonType: lesson.lessonType ?? 'theory',
    htmlContent: lesson.content_type === 'html' ? (lesson.content ?? '') : '',
    videoFile: null,
    attachmentFiles: [],
  };

  const existingVideoUrl = lesson.content_type === 'video' ? lesson.content : null;
  const existingAttachments =
    lesson.attachments?.map((a) => ({
      name: typeof a === 'string' ? a : a.name,
      url: typeof a === 'string' ? a : a.url,
    })) ?? [];

  return (
    <LessonForm
      defaultValues={defaultValues}
      existingVideoUrl={existingVideoUrl}
      existingAttachments={existingAttachments}
      isEditMode
      isLoading={updateMutation.isPending}
      onSubmit={(data) => updateMutation.mutate(data)}
    />
  );
};

export default EditLesson;
