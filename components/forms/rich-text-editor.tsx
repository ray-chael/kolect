"use client";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";

interface RichTextEditorProps {
  value?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a detailed product description...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[160px] px-3 py-2 focus:outline-none",
      },
    },
  });

  // Sync external value changes into the editor (e.g. edit form loading existing content)
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    const normalized = value || "";
    if (normalized !== currentHTML && !(editor.isEmpty && !normalized)) {
      editor.commands.setContent(normalized);
    }
  }, [editor, value]);

  // Subscribe to editor state so toolbar buttons re-render on selection/mark changes.
  // In TipTap v3, useEditor alone does NOT trigger re-renders on transactions.
  const toolbarState = useEditorState({
    editor,
    selector: (ctx) => {
      const e = ctx.editor;
      if (!e)
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isStrike: false,
          isH2: false,
          isH3: false,
          isBullet: false,
          isOrdered: false,
          isAlignLeft: false,
          isAlignCenter: false,
          isAlignRight: false,
          isLink: false,
        };
      return {
        isBold: e.isActive("bold"),
        isItalic: e.isActive("italic"),
        isUnderline: e.isActive("underline"),
        isStrike: e.isActive("strike"),
        isH2: e.isActive("heading", { level: 2 }),
        isH3: e.isActive("heading", { level: 3 }),
        isBullet: e.isActive("bulletList"),
        isOrdered: e.isActive("orderedList"),
        isAlignLeft: e.isActive({ textAlign: "left" }),
        isAlignCenter: e.isActive({ textAlign: "center" }),
        isAlignRight: e.isActive({ textAlign: "right" }),
        isLink: e.isActive("link"),
      };
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-input bg-transparent ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={toolbarState?.isBold ?? false}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={toolbarState?.isItalic ?? false}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={toolbarState?.isUnderline ?? false}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={toolbarState?.isStrike ?? false}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border/60" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={toolbarState?.isH2 ?? false}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={toolbarState?.isH3 ?? false}
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border/60" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={toolbarState?.isBullet ?? false}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={toolbarState?.isOrdered ?? false}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border/60" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={toolbarState?.isAlignLeft ?? false}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={toolbarState?.isAlignCenter ?? false}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={toolbarState?.isAlignRight ?? false}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border/60" />

        <ToolbarButton
          onClick={setLink}
          active={toolbarState?.isLink ?? false}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-border/60" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
        active && "bg-muted text-primary"
      )}
    >
      {children}
    </button>
  );
}
