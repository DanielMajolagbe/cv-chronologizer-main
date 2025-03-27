import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Bold, Italic, List, AlignLeft } from 'lucide-react';

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
  height = '250px'
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc pl-6',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-2',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm focus:outline-none max-w-none',
          'min-h-[200px] p-4'
        ),
      },
    },
  });

  // Update content if value changes externally
  React.useEffect(() => {
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
        <div className="flex items-center space-x-1">
          <span className="text-xs text-muted-foreground ml-1 mr-2">Basic Formatting:</span>
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
          
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          
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
        </div>
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