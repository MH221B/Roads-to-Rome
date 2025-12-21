import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import LessonEditor from './LessonEditor';
import { Upload, X } from 'lucide-react';

export type LessonType = 'theory' | 'practical' | 'lab';

export interface LessonFormValues {
  title: string;
  lessonType: LessonType;
  htmlContent: string;
  videoFile: File | null;
  attachmentFiles: File[];
}

interface LessonFormProps {
  defaultValues?: Partial<LessonFormValues>;
  onSubmit: (data: LessonFormValues) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  existingVideoUrl?: string | null;
  existingAttachments?: Array<{ name: string; url: string }>;
}

const LessonForm: React.FC<LessonFormProps> = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  isEditMode,
  existingVideoUrl,
  existingAttachments,
}) => {
  const { register, handleSubmit, control, setValue, watch } = useForm<{
    title: string;
    lessonType: LessonType;
  }>({
    defaultValues: {
      title: defaultValues?.title ?? '',
      lessonType: defaultValues?.lessonType ?? 'theory',
    },
  });

  const [htmlContent, setHtmlContent] = React.useState<string>(defaultValues?.htmlContent ?? '');
  const [videoFile, setVideoFile] = React.useState<File | null>(defaultValues?.videoFile ?? null);
  const [videoPreview, setVideoPreview] = React.useState<string | null>(existingVideoUrl ?? null);
  const [attachmentFiles, setAttachmentFiles] = React.useState<File[]>(
    defaultValues?.attachmentFiles ?? []
  );
  const [existingAttachmentList, setExistingAttachmentList] = React.useState<
    Array<{ name: string; url: string }>
  >(existingAttachments ?? []);

  // Video dropzone - accepts only video files
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setVideoFile(acceptedFiles[0]);
        const url = URL.createObjectURL(acceptedFiles[0]);
        setVideoPreview(url);
      }
    },
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.mov'],
    },
    maxFiles: 1,
  });

  // Attachment dropzone - accepts documents, images, and markdown
  const {
    getRootProps: getAttachmentRootProps,
    getInputProps: getAttachmentInputProps,
    isDragActive: isAttachmentDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachmentFiles((prev) => [...prev, ...acceptedFiles]);
    },
    accept: {
      'video/*': ['.mp4', '.webm', '.ogg', '.mov'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleEditorChange = (c: string) => {
    setHtmlContent(c);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
  };

  const handleRemoveAttachment = (idx: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingAttachmentList((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleClearAllAttachments = () => {
    setAttachmentFiles([]);
    setExistingAttachmentList([]);
  };

  const submit = (data: { title: string; lessonType: LessonType }) => {
    const output: LessonFormValues = {
      title: data.title,
      lessonType: data.lessonType,
      htmlContent,
      videoFile,
      attachmentFiles,
    };

    onSubmit(output);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <form onSubmit={handleSubmit(submit)}>
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Lesson' : 'Create Lesson'}</CardTitle>
            <CardDescription>Provide details to publish a lesson.</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block text-sm font-medium">Title</Label>
                <Input
                  {...register('title', { required: 'Title is required' })}
                  placeholder="Lesson title"
                />
              </div>

              <div>
                <Label className="mb-1 block text-sm font-medium">Lesson Type</Label>
                <Controller
                  name="lessonType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select lesson type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="theory">Theory</SelectItem>
                        <SelectItem value="practical">Practical</SelectItem>
                        <SelectItem value="lab">Lab</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label className="mb-1 block text-sm font-medium">Content</Label>
                <LessonEditor initialContent={htmlContent} onChange={handleEditorChange} />
              </div>

              {/* Video Dropzone */}
              <div>
                <Label className="mb-2 block text-sm font-medium">Lesson Video (Optional)</Label>
                <div
                  {...getVideoRootProps()}
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isVideoDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <input {...getVideoInputProps()} />
                  <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  {videoFile || videoPreview ? (
                    <div>
                      <p className="font-medium text-gray-900">
                        {videoFile?.name ?? 'Existing video'}
                      </p>
                      {videoFile && (
                        <p className="text-sm text-gray-500">
                          {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveVideo();
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-900">
                        {isVideoDragActive ? 'Drop video here' : 'Drag video file here'}
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse (MP4, WebM, OGG, MOV)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments Dropzone */}
              <div>
                <Label className="mb-2 block text-sm font-medium">Attachments (Optional)</Label>
                <div
                  {...getAttachmentRootProps()}
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isAttachmentDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  <input {...getAttachmentInputProps()} />
                  <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  {attachmentFiles.length > 0 || existingAttachmentList.length > 0 ? (
                    <div>
                      <p className="mb-3 font-medium text-gray-900">
                        {attachmentFiles.length + existingAttachmentList.length} file
                        {attachmentFiles.length + existingAttachmentList.length !== 1
                          ? 's'
                          : ''}{' '}
                        selected
                      </p>
                      <ul className="mb-3 space-y-2 text-left">
                        {existingAttachmentList.map((attachment, idx) => (
                          <li
                            key={`existing-${idx}`}
                            className="flex items-center justify-between rounded bg-white p-2"
                          >
                            <span className="text-sm text-gray-700">{attachment.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAttachment(idx, true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                        {attachmentFiles.map((file, idx) => (
                          <li
                            key={`new-${idx}`}
                            className="flex items-center justify-between rounded bg-white p-2"
                          >
                            <span className="text-sm text-gray-700">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAttachment(idx, false);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearAllAttachments();
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium text-gray-900">
                        {isAttachmentDragActive ? 'Drop files here' : 'Drag files here'}
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse (PDF, MD, Images, DOC, DOCX)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={Boolean(isLoading)}>
              {isLoading
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save'
                  : 'Create'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={Boolean(isLoading)}
              >
                Cancel
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default LessonForm;
