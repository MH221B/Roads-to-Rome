import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { getLesson, updateLesson, uploadFile, deleteLesson } from '@/services/lessonService';
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

      // Determine content - separate from video
      if (data.videoFile) {
        // User uploaded a new video
        const uploadRes = await uploadFile(data.videoFile);
        payload.video = uploadRes?.url ?? null;
      } else if (data.deletedVideoUrl) {
        // User explicitly deleted the video
        payload.video = null;
      } else if (lesson?.video) {
        // Keep existing video
        payload.video = lesson.video;
      }

      // HTML content
      payload.content = data.htmlContent;

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

      // Include deleted files for Supabase cleanup
      if (data.deletedVideoUrl) {
        payload.deletedVideoUrl = data.deletedVideoUrl;
      }
      if (data.deletedAttachmentUrls && data.deletedAttachmentUrls.length > 0) {
        payload.deletedAttachmentUrls = data.deletedAttachmentUrls;
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
        navigate(`/courses/${courseId}/lessons/${lessonId}`);
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!courseId || !lessonId) throw new Error('Missing course or lesson id');
      return await deleteLesson(courseId, lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', courseId, lessonId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      Swal.fire({
        title: 'Deleted',
        text: 'Lesson has been deleted successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981',
      }).then(() => {
        navigate(`/courses/${courseId}`);
      });
    },
    onError: (err: any) => {
      console.error('Failed to delete', err);
      const msg = err?.response?.data?.error ?? err?.message ?? 'Failed to delete lesson.';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
      });
    },
  });

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Lesson?',
      text: 'This action cannot be undone. Are you sure you want to delete this lesson?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) return <div className="p-6">Loading lesson...</div>;
  if (!lesson) return <div className="p-6">Lesson not found.</div>;

  const defaultValues: Partial<LessonFormValues> = {
    title: lesson.title,
    lessonType: lesson.lessonType ?? 'theory',
    htmlContent: lesson.content ?? '',
    videoFile: null,
    attachmentFiles: [],
  };

  const existingVideoUrl = lesson.video ?? null;
  const existingAttachments =
    lesson.attachments?.map((a) => ({
      name: typeof a === 'string' ? a : a.name,
      url: typeof a === 'string' ? a : a.url,
    })) ?? [];

  return (
    <div className="space-y-4">
      <LessonForm
        defaultValues={defaultValues}
        existingVideoUrl={existingVideoUrl}
        existingAttachments={existingAttachments}
        isEditMode
        isLoading={updateMutation.isPending}
        onSubmit={(data) => updateMutation.mutate(data)}
        onCancel={() => navigate(`/courses/${courseId}/lessons/${lessonId}`)}
      />
      <div className="px-6">
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Lesson'}
        </button>
      </div>
    </div>
  );
};

export default EditLesson;
