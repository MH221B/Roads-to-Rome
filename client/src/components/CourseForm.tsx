import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { FaDollarSign } from 'react-icons/fa';
import { getCourses } from '@/services/courseService';
import { extractTagsFromCourses } from '@/lib/utils';

export interface CourseFormValues {
  title: string;
  category?: string;
  shortDescription?: string;
  difficulty?: string | null;
  tags: string[];
  thumbnail?: File | string | null;
  is_premium?: boolean;
  price?: number;
  status?: string;
  deletedThumbnailUrl?: string | null;
}

interface CourseFormProps {
  defaultValues?: Partial<CourseFormValues>;
  onSubmit: (data: CourseFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  existingThumbnailUrl?: string | null;
  onSubmitForReview?: (data: CourseFormValues) => void;
  isSubmittingForReview?: boolean;
}

const CourseForm: React.FC<CourseFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  isEditMode,
  existingThumbnailUrl,
  onSubmitForReview,
  isSubmittingForReview,
}) => {
  const navigate = useNavigate();
  const defaultHandleCancel = () => navigate('/');
  const handleCancel = onCancel ?? defaultHandleCancel;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CourseFormValues>({
    defaultValues: {
      title: defaultValues?.title ?? '',
      category: defaultValues?.category ?? '',
      shortDescription: defaultValues?.shortDescription ?? '',
      difficulty: defaultValues?.difficulty ?? 'beginner',
      tags: defaultValues?.tags ?? [],
      thumbnail: defaultValues?.thumbnail ?? null,
      is_premium: defaultValues?.is_premium ?? false,
      price: defaultValues?.price ?? 0,
      status: defaultValues?.status ?? 'published',
    },
  });

  const [tagQuery, setTagQuery] = React.useState('');
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(
    typeof defaultValues?.thumbnail === 'string' ? (defaultValues?.thumbnail as string) : null
  );
  const [deletedThumbnailUrl, setDeletedThumbnailUrl] = React.useState<string | null>(null);
  const [allTagsFromDb, setAllTagsFromDb] = React.useState<string[]>([]);

  const selectedTags = watch('tags') ?? [];

  // Fetch all tags from database on component mount
  React.useEffect(() => {
    let mounted = true;
    const fetchTags = async () => {
      try {
        const courses = await getCourses(1, 1000);
        if (!mounted) return;
        setAllTagsFromDb(extractTagsFromCourses(courses));
      } catch (e) {
        // Fallback to empty array if fetch fails
        if (mounted) {
          setAllTagsFromDb([]);
        }
      }
    };

    fetchTags();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:'))
        URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setValue('thumbnail', file);

    if (file) {
      // Mark old thumbnail for deletion if it exists
      if (
        existingThumbnailUrl &&
        thumbnailPreview === existingThumbnailUrl &&
        !thumbnailPreview.startsWith('blob:')
      ) {
        setDeletedThumbnailUrl(existingThumbnailUrl);
      }
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    } else {
      setThumbnailPreview(
        defaultValues?.thumbnail && typeof defaultValues.thumbnail === 'string'
          ? (defaultValues.thumbnail as string)
          : null
      );
    }
  };

  const addTagFromQuery = (q?: string) => {
    const val = (q ?? tagQuery).trim();
    if (!val) return;

    const match = allTagsFromDb.find((t) => t.toLowerCase() === val.toLowerCase());
    const tagToAdd = match ?? val;

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

  const submit = (data: CourseFormValues) => {
    // Check if premium course has valid price
    if (data.is_premium && (!data.price || data.price <= 0)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Price',
        text: 'Premium courses must have a price greater than 0',
        confirmButtonText: 'OK',
      });
      return;
    }

    // if user typed a tag but didn't hit enter, add it
    let finalTags = data.tags ?? [];
    if (tagQuery.trim()) {
      const val = tagQuery.trim();
      if (!finalTags.includes(val)) finalTags = [...finalTags, val];
    }

    const out: CourseFormValues = {
      ...data,
      tags: finalTags,
      thumbnail: data.thumbnail ?? defaultValues?.thumbnail ?? null,
      deletedThumbnailUrl: deletedThumbnailUrl || undefined,
    };

    onSubmit(out);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <form onSubmit={handleSubmit(submit)} encType="multipart/form-data">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Course' : 'Create Course'}</CardTitle>
            <CardDescription>Provide details to publish a course.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
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

              <div>
                <Label className="mb-1 block text-sm font-medium">Thumbnail</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="block"
                />
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="mt-2 max-h-40 rounded border"
                  />
                ) : existingThumbnailUrl ? (
                  <img
                    src={existingThumbnailUrl}
                    alt="Existing thumbnail"
                    className="mt-2 max-h-40 rounded border"
                  />
                ) : null}
              </div>

              <div>
                <Label className="mb-1 block text-sm font-medium">Category</Label>
                <Input {...register('category')} placeholder="e.g. Web Development" />
              </div>

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
                          {allTagsFromDb
                            .filter((t) => t.toLowerCase().includes(tagQuery.trim().toLowerCase()))
                            .slice(0, 8)
                            .map((suggestion) => (
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
                          {allTagsFromDb.filter((t) =>
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

              <div>
                <Label className="mb-1 block text-sm font-medium">Short Description</Label>
                <Textarea {...register('shortDescription')} className="h-30 resize-none" rows={5} />
              </div>

              <div>
                <Label className="mb-1 block text-sm font-medium">Difficulty</Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
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

              <div>
                <Label className="mb-1 block text-sm font-medium">Access</Label>
                <div className="flex items-center gap-4">
                  <Controller
                    name="is_premium"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(val: any) => field.onChange(Boolean(val))}
                        />
                        <span className="text-sm">Premium (paid)</span>
                      </div>
                    )}
                  />
                  {watch('is_premium') && (
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative flex-1">
                        <div className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                          <FaDollarSign size={16} />
                        </div>
                        <Input
                          {...register('price', {
                            min: { value: 0, message: 'Price must be 0 or greater' },
                            valueAsNumber: true,
                          })}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {errors.price && watch('is_premium') && (
                  <span className="mt-1 block text-xs text-red-500">{errors.price.message}</span>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={Boolean(isLoading)}>
                {isLoading
                  ? isEditMode
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Save'
                    : 'Create'}
              </Button>
              {isEditMode &&
                onSubmitForReview &&
                (defaultValues?.status === 'draft' || defaultValues?.status === 'rejected') && (
                  <Button
                    type="button"
                    onClick={() => onSubmitForReview(watch() as CourseFormValues)}
                    disabled={Boolean(isSubmittingForReview)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmittingForReview ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                )}
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CourseForm;
