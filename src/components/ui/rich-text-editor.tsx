import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { 
  Bold, 
  Italic, 
  List, 
  AlignLeft, 
  Heading1, 
  Heading2,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  height?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  className,
  placeholder = 'Write something...',
  height = '200px'
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-6',
        },
        keepMarks: true,
        keepAttributes: true,
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-2',
        },
        keepMarks: true,
      }),
      Paragraph.configure({
        HTMLAttributes: {
          class: 'mb-2',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Clean HTML output by replacing any encoded entities in list elements
      const cleanedHtml = html
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
      onChange(cleanedHtml);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm focus:outline-none max-w-none',
          'min-h-[150px] p-4'
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const MenuBar = () => {
    if (!editor) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-gray-50">
        <div className="flex space-x-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            type="button"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            type="button"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'h-8 px-2 text-sm',
            editor.isActive('heading', { level: 2 }) ? 'bg-muted text-foreground' : 'text-muted-foreground'
          )}
          type="button"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4 mr-1" />
          Heading
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bold') ? 'bg-muted text-foreground' : 'text-muted-foreground'
          )}
          type="button"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('italic') ? 'bg-muted text-foreground' : 'text-muted-foreground'
          )}
          type="button"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <div className="h-6 w-px bg-gray-300 mx-1"></div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('bulletList') ? 'bg-muted text-foreground' : 'text-muted-foreground'
          )}
          type="button"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={cn(
            'h-8 w-8 p-0',
            editor.isActive('paragraph') ? 'bg-muted text-foreground' : 'text-muted-foreground'
          )}
          type="button"
          title="Paragraph"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-3 ml-2">Double click to select tool</p>
      </div>
    );
  };

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      <MenuBar />
      <div 
        style={{ height }} 
        className="bg-white relative"
      >
        <EditorContent
          editor={editor}
          className="h-full overflow-y-auto"
        />
        {editor && !editor.getText() && (
          <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}; 