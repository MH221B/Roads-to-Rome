import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';

interface LessonEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-gray-200 bg-gray-50 p-2">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('bold')
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('italic')
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('underline')
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        <u>U</u>
      </button>
      <div className="border-l border-gray-300" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('heading', { level: 1 })
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        • List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('orderedList')
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        1. List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
          editor.isActive('codeBlock')
            ? 'bg-blue-500 text-white'
            : 'border border-gray-300 bg-white hover:bg-gray-100'
        }`}
      >
        &lt; &gt;
      </button>
      <div className="border-l border-gray-300" />
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↶
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ↷
      </button>
    </div>
  );
};

export default function LessonEditor({ initialContent = '', onChange }: LessonEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your lesson content...',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        allowBase64: true,
      }),
      Underline,
    ],
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700">Content</label>
      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
        <MenuBar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-sm min-h-64 max-w-none px-4 py-3 text-gray-900 focus:outline-none"
        />
      </div>
    </div>
  );
}
