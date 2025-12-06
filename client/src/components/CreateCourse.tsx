import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/axiosClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { CiCircleRemove } from 'react-icons/ci';

// Define Form Type
interface CreateCourseFormValues {
  title: string;
  category: string;
  shortDescription: string;
  difficulty: string;
  tags: string[];
  thumbnail: File | null;
}

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCourseFormValues>({
    defaultValues: {
      title: '',
      category: '',
      shortDescription: '',
      difficulty: 'beginner',
      tags: [],
      thumbnail: null,
    },
  });

  // Local state purely for UI (Tag search input & Image preview)
  const [tagQuery, setTagQuery] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Watch tags to render them
  const selectedTags = watch('tags');

  // Local sample tags (backend not implemented yet)
  const allTags = useMemo(
    () => ['web development', 'javascript', 'react', 'node', 'typescript', 'css', 'html'],
    []
  );

  // React Query: Mutation for Create (sends multipart/form-data to backend)
  const createMutation = useMutation({
    mutationFn: async (data: CreateCourseFormValues) => {
      const form = new FormData();
      form.append('title', data.title || '');
      if (data.category) form.append('category', data.category);
      if (data.shortDescription) form.append('shortDescription', data.shortDescription);
      if (data.difficulty) form.append('difficulty', data.difficulty);
      // instructor is automatically set server-side from the authenticated user

      // append tags as JSON string so server can parse reliably
      if (Array.isArray(data.tags) && data.tags.length > 0) {
        form.append('tags', JSON.stringify(data.tags));
      }

      // append file under field name `thumbnail` (multer expects this)
      if (data.thumbnail) {
        form.append('thumbnail', data.thumbnail);
      }

      const resp = await api.post('/api/courses', form, {
        headers: {
          // Let browser set Content-Type with boundary for multipart
          Accept: 'application/json',
        },
      });

      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      navigate('/courses'); // Redirect to list
    },
    onError: (error: any) => {
      console.error('Failed to create course', error);
      const msg =
        error?.response?.data?.error ??
        error?.message ??
        'Failed to create course. Please try again.';
      alert(msg);
    },
  });

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  // Handle File Change wrapper
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setValue('thumbnail', file); // Update RHF state

    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    } else {
      setThumbnailPreview(null);
    }
  };

  // Tag Logic
  const addTagFromQuery = (q?: string) => {
    const val = (q ?? tagQuery).trim();
    if (!val) return;

    const match = allTags.find((t: string) => t.toLowerCase() === val.toLowerCase());
    const tagToAdd = match ?? val;

    // Prevent duplicates
    if (!selectedTags.includes(tagToAdd)) {
      setValue('tags', [...selectedTags, tagToAdd]);
    }
    setTagQuery('');
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      'tags',
      selectedTags.filter((t) => t !== tagToRemove)
    );
  };

  const onSubmit: SubmitHandler<CreateCourseFormValues> = (data) => {
    // If user typed a tag but didn't hit enter, add it now
    let finalTags = data.tags;
    if (tagQuery.trim()) {
      const val = tagQuery.trim();
      if (!finalTags.includes(val)) {
        finalTags = [...finalTags, val];
      }
    }

    // Trigger mutation
    createMutation.mutate({ ...data, tags: finalTags });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
        <Card>
          <CardHeader>
            <CardTitle>Create Course</CardTitle>
            <CardDescription>Provide details to publish a new course.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* TITLE */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Title</Label>
                <Input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Course title"
                />
                {errors.title && (
                  <span className="text-xs text-red-500">{errors.title.message}</span>
                )}
              </div>

              {/* THUMBNAIL */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Thumbnail</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="block"
                />
                {thumbnailPreview && (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="mt-2 max-h-40 rounded border"
                  />
                )}
              </div>

              {/* CATEGORY */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Category</Label>
                <Input {...register('category')} placeholder="e.g. Web Development" />
              </div>

              {/* TAGS */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Tags</Label>
                <div className="flex flex-col gap-2">
                  <div className="relative z-20">
                    <Input
                      value={tagQuery}
                      onChange={(e) => setTagQuery(e.target.value)}
                      placeholder="Search or type to add tags"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTagFromQuery();
                        }
                      }}
                      className="w-full text-sm"
                    />
                    {tagQuery && (
                      <div className="absolute top-full mt-1 w-full rounded-md border bg-white p-2 shadow-lg dark:bg-gray-950">
                        <div className="flex flex-wrap gap-2">
                          {allTags
                            .filter((t: string) =>
                              t.toLowerCase().includes(tagQuery.trim().toLowerCase())
                            )
                            .slice(0, 8)
                            .map((suggestion: string) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  setTagQuery('');
                                  addTagFromQuery(suggestion);
                                }}
                                className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                              >
                                {suggestion}
                              </button>
                            ))}
                          {allTags.filter((t: string) =>
                            t.toLowerCase().includes(tagQuery.trim().toLowerCase())
                          ).length === 0 && (
                            <span className="text-muted-foreground p-1 text-xs">
                              No matching tags found. Press Enter to create.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-input flex h-24 w-full flex-wrap content-start gap-2 overflow-y-auto rounded-md border bg-transparent p-2 text-sm shadow-sm">
                    {selectedTags.length > 0 ? (
                      selectedTags.map((tag) => (
                        <Badge key={tag} className="flex h-7 items-center gap-2 pr-1">
                          <span>#{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-primary-foreground/20 ml-1 rounded-full p-0.5"
                          >
                            <CiCircleRemove size={14} />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm opacity-50 select-none">
                        Selected tags will appear here...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Short Description</Label>
                <Textarea {...register('shortDescription')} className="h-30 resize-none" rows={5} />
              </div>

              {/* DIFFICULTY (Using Controller) */}
              <div>
                <Label className="mb-1 block text-sm font-medium">Difficulty</Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={(createMutation as any).isLoading}>
                {(createMutation as any).isLoading ? 'Creating...' : 'Create'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/courses')}>
                Cancel
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CreateCourse;
