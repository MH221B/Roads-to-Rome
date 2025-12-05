import * as React from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getCourses } from '@/services/courseService';

const CreateCourse: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(null);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [tagQuery, setTagQuery] = React.useState('');
  const [allTags, setAllTags] = React.useState<string[]>([]);
  const [difficulty, setDifficulty] = React.useState('beginner');

  React.useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbnailFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If the user typed something in the tag input but didn't press Enter,
    // include those tags as well.
    const tagsFromQuery = tagQuery
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const tags = Array.from(new Set([...selectedTags, ...tagsFromQuery]));

    // Simple validation
    if (!title.trim()) {
      // Replace with your UI error handling if desired
      alert('Please provide a title for the course.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('shortDescription', shortDescription);
    formData.append('difficulty', difficulty);
    formData.append('tags', JSON.stringify(tags));
    if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

    try {
      // If you have a service to create a course, call it here, e.g.
      // await createCourse(formData);
      // For now keep existing behavior: log and navigate on success.
      console.log('Create course form data:', {
        title,
        category,
        shortDescription,
        tags,
        difficulty,
        thumbnailFile,
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to create course', err);
      alert('Failed to create course. Please try again.');
    }
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getCourses(1, 200);
        if (!mounted) return;
        const tags = Array.from(new Set(data.flatMap((c) => c.tags)));
        setAllTags(tags);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addTagFromQuery = (q?: string) => {
    const val = (q ?? tagQuery).trim();
    if (!val) return;
    const match = allTags.find((t) => t.toLowerCase() === val.toLowerCase());
    const tagToAdd = match ?? val;
    setSelectedTags((prev) => (prev.includes(tagToAdd) ? prev : [...prev, tagToAdd]));
    setTagQuery('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Course</CardTitle>
            <CardDescription>Provide details to publish a new course.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-sm font-medium">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

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

              <div>
                <Label className="mb-1 block text-sm font-medium">Category</Label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>

              <div>
                <Label className="mb-1 block text-sm font-medium">Tags</Label>
                <div className="flex flex-col gap-2">
                  {/* 1. INPUT & FLOATING SUGGESTIONS */}
                  <div className="relative z-20">
                    <Input
                      value={tagQuery}
                      onChange={(e) => setTagQuery((e.target as HTMLInputElement).value)}
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
                            .filter((t) => t.toLowerCase().includes(tagQuery.trim().toLowerCase()))
                            .slice(0, 8)
                            .map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => {
                                  setTagQuery(''); // Clear query immediately
                                  addTagFromQuery(suggestion);
                                }}
                                className="rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                              >
                                {suggestion}
                              </button>
                            ))}
                          {/* Optional: Show message if no matches */}
                          {allTags.filter((t) =>
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
                            aria-label={`Remove ${tag}`}
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
                <Textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="h-30 resize-none"
                  rows={5}
                />
              </div>

              <div>
                <Label className="mb-1 block text-sm font-medium">Difficulty</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="flex items-center gap-3">
              <Button type="submit">Create</Button>
              <Button variant="ghost" onClick={() => navigate('/courses')}>
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
