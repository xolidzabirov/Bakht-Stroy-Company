"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, Link2Off, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { useI18n } from "@/shared/i18n/client";
import { cn } from "@/shared/lib/cn";

/**
 * Article text editor. Only formats the server keeps (SafeHtml): headings, paragraphs, lists, bold / italic,
 * quotes and links — no colours or fonts, so every post looks like the rest of the site.
 */
/** `label` names the editable area for screen readers (a <label for> does not reach a contenteditable). */
export function RichTextEditor({ value, onChange, id, invalid, label }: { value: string; onChange: (html: string) => void; id?: string; invalid?: boolean; label?: string }) {
  const { t } = useI18n();
  const e = t.admin.news.editor;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, protocols: ["https", "http", "mailto", "tel"] },
      }),
    ],
    content: value,
    // The page is rendered on the server first; the editor appears after hydration.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id: id ?? "",
        class: "prose-bakht min-h-72 px-4 py-2 outline-none [&>*:first-child]:mt-2",
        "aria-multiline": "true",
        "aria-label": label ?? "",
        role: "textbox",
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.isEmpty ? "" : current.getHTML()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive("bold"),
            italic: current.isActive("italic"),
            h2: current.isActive("heading", { level: 2 }),
            h3: current.isActive("heading", { level: 3 }),
            bullet: current.isActive("bulletList"),
            ordered: current.isActive("orderedList"),
            quote: current.isActive("blockquote"),
            link: current.isActive("link"),
            canUndo: current.can().undo(),
            canRedo: current.can().redo(),
          }
        : null,
  });

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(e.linkPrompt, previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const tools = editor && state
    ? [
        { label: e.bold, icon: Bold, active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
        { label: e.italic, icon: Italic, active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
        { label: e.h2, icon: Heading2, active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: e.h3, icon: Heading3, active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: e.bullet, icon: List, active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
        { label: e.ordered, icon: ListOrdered, active: state.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
        { label: e.quote, icon: Quote, active: state.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
        { label: e.link, icon: Link2, active: state.link, run: setLink },
        ...(state.link ? [{ label: e.unlink, icon: Link2Off, active: false, run: () => editor.chain().focus().unsetLink().run() }] : []),
      ]
    : [];

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-surface transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20", invalid ? "border-destructive" : "border-input")}>
      <div role="toolbar" className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 p-1.5">
        {tools.map(({ label, icon: Icon, active, run }) => (
          <button
            key={label}
            type="button"
            onClick={run}
            aria-label={label}
            title={label}
            aria-pressed={active}
            className={cn("grid size-9 place-items-center rounded-lg transition", active ? "bg-ink text-white dark:bg-white dark:text-ink" : "text-muted-foreground hover:bg-surface hover:text-foreground")}
          >
            <Icon className="size-4" />
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" onClick={() => editor?.chain().focus().undo().run()} disabled={!state?.canUndo} aria-label={e.undo} title={e.undo} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface disabled:opacity-30">
          <Undo2 className="size-4" />
        </button>
        <button type="button" onClick={() => editor?.chain().focus().redo().run()} disabled={!state?.canRedo} aria-label={e.redo} title={e.redo} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface disabled:opacity-30">
          <Redo2 className="size-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
