import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { api } from '@/services/axiosClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LessonEditor from './LessonEditor';
import { Upload } from 'lucide-react';

interface FormValues {
  title: string;
}

const uploadFile = async (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/api/uploads', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // expect { url }
};

const createLesson = async (courseId: string, payload: any) => {
  const { data } = await api.post(`/api/courses/${courseId}/lessons`, payload);
  return data;
};

export default function CreateLesson() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { title: '' },
  });

  const [htmlContent, setHtmlContent] = React.useState<string>('');
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [attachmentFiles, setAttachmentFiles] = React.useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      if (!courseId) throw new Error('Missing courseId');

      const payload: any = {
        title: values.title,
        content_type: 'html',
        content: htmlContent,
      };

      // If a video is uploaded, set it as video content
      if (videoFile) {
        const uploadRes = await uploadFile(videoFile);
        payload.content_type = 'video';
        payload.content = uploadRes?.url ?? null;
      }

      return await createLesson(courseId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      navigate(`/courses/${courseId}`);
    },
  });

  const onSubmit = (vals: FormValues) => {
    mutation.mutate(vals);
  };

  // Video dropzone - accepts only video files
  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setVideoFile(acceptedFiles[0]);
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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h2 className="mb-4 text-2xl font-bold">Create Lesson</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block text-sm font-medium">Title</Label>
            <Input {...register('title', { required: true })} placeholder="Lesson title" />
          </div>

          <div>
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
              {videoFile ? (
                <div>
                  <p className="font-medium text-gray-900">{videoFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setVideoFile(null);
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
                  <p className="text-sm text-gray-500">or click to browse (MP4, WebM, OGG, MOV)</p>
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
              {attachmentFiles.length > 0 ? (
                <div>
                  <p className="mb-3 font-medium text-gray-900">
                    {attachmentFiles.length} file{attachmentFiles.length !== 1 ? 's' : ''} selected
                  </p>
                  <ul className="mb-3 space-y-2 text-left">
                    {attachmentFiles.map((file, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between rounded bg-white p-2"
                      >
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          ✕
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      setAttachmentFiles([]);
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

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create Lesson'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
