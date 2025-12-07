import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import api from '@/services/axiosClient';
import CourseForm from '@/components/CourseForm';
import type { CourseFormValues } from '@/components/CourseForm';

const EditCourse: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      if (!id) return null;
      const resp = await api.get(`/api/courses/${id}`);
      return resp.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      if (!id) throw new Error('Missing course id');

      const form = new FormData();
      form.append('title', data.title || '');
      if (data.category) form.append('category', data.category);
      if (data.shortDescription) form.append('shortDescription', data.shortDescription);
      if (data.difficulty) form.append('difficulty', String(data.difficulty ?? ''));

      if (Array.isArray(data.tags) && data.tags.length > 0)
        form.append('tags', JSON.stringify(data.tags));

      if (typeof data.is_premium !== 'undefined')
        form.append('is_premium', String(Boolean(data.is_premium)));
      if (data.status) form.append('status', data.status);

      // Only append thumbnail if it's a File (user selected a new file)
      if (data.thumbnail && typeof data.thumbnail !== 'string') {
        form.append('thumbnail', data.thumbnail as File);
      }

      const resp = await api.patch(`/api/courses/${id}`, form, {
        headers: { Accept: 'application/json' },
      });

      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      Swal.fire({
        title: 'Saved',
        text: 'Course updated.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981',
      }).then(() => {
        navigate(`/courses/${id}`);
      });
    },
    onError: (err: any) => {
      console.error('Failed to update', err);
      const msg = err?.response?.data?.error ?? err?.message ?? 'Failed to update course.';
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444',
      });
    },
  });

  if (isLoading) return <div className="p-6">Loading course...</div>;
  if (!course) return <div className="p-6">Course not found.</div>;

  const defaultValues: Partial<CourseFormValues> = {
    title: course.title,
    category: course.category,
    shortDescription: course.shortDescription,
    difficulty: course.difficulty ?? 'beginner',
    tags: Array.isArray(course.tags) ? course.tags : [],
    thumbnail: course.thumbnail ?? null,
    is_premium: course.is_premium ?? false,
    status: course.status ?? 'published',
  };

  return (
    <CourseForm
      defaultValues={defaultValues}
      existingThumbnailUrl={course.thumbnail ?? null}
      isEditMode
      isLoading={updateMutation.isPending}
      onSubmit={(data) => updateMutation.mutate(data)}
    />
  );
};

export default EditCourse;
