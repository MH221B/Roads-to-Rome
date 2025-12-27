import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import api from '@/services/axiosClient';
import CourseForm, { type CourseFormValues } from '@/components/CourseForm';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CourseFormValues) => {
      const form = new FormData();
      form.append('title', data.title || '');
      if (data.category) form.append('category', data.category);
      if (data.shortDescription) form.append('shortDescription', data.shortDescription);
      if (data.difficulty) form.append('difficulty', String(data.difficulty ?? ''));

      if (Array.isArray(data.tags) && data.tags.length > 0) {
        form.append('tags', JSON.stringify(data.tags));
      }

      if (typeof data.is_premium !== 'undefined') {
        form.append('is_premium', String(Boolean(data.is_premium)));
      }
      // Auto-set status to 'draft' for new courses
      form.append('status', 'draft');

      // Only append file if it's a File object
      if (data.thumbnail && typeof data.thumbnail !== 'string') {
        form.append('thumbnail', data.thumbnail as File);
      }

      const resp = await api.post('/api/courses', form, {
        headers: { Accept: 'application/json' },
      });
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      Swal.fire({
        title: 'Success!',
        text: 'Course created successfully.',
        icon: 'success',
        confirmButtonText: 'Great!',
        confirmButtonColor: '#10b981',
      }).then(() => {
        navigate('/');
      });
    },
    onError: (error: any) => {
      console.error('Failed to create course', error);
      const msg =
        error?.response?.data?.error ??
        error?.message ??
        'Failed to create course. Please try again.';
      Swal.fire({
        title: 'Error!',
        text: msg,
        icon: 'error',
        confirmButtonText: 'Okay',
        confirmButtonColor: '#ef4444',
      });
    },
  });

  const isLoading = (createMutation as any).isLoading as boolean;

  return (
    <CourseForm
      onSubmit={(data) => createMutation.mutate(data)}
      isLoading={isLoading}
      isEditMode={false}
    />
  );
};

export default CreateCoursePage;
