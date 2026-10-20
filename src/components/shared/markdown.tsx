import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders trusted-ish markdown (admin authored). HTML is not rendered (react-markdown default). */
export function MarkdownPreview({
  content,
  className = "prose-store",
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
