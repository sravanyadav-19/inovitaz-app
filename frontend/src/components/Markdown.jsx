/**
 * Markdown — safe GFM rendering for project content fields.
 * Used by: ProjectDetails (view) + AdminProjects (preview via MarkdownField).
 *
 *   <Markdown>{text}</Markdown>         — block rendering (steps, overview, notes)
 *   <Markdown inline>{item}</Markdown>  — inline rendering inside chips/list items
 *
 * Security: rehypeSanitize strips raw HTML/scripts — authors write Markdown,
 * never executable HTML. GFM adds tables, strikethrough, and task lists.
 */
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

export default function Markdown({ children, inline = false }) {
  const raw = children == null ? '' : String(children).trim();
  if (!raw) return null;
  return (
    <div className={inline ? 'md-content md-inline' : 'md-content'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize]]}
        components={inline ? { p: 'span' } : undefined}
      >
        {raw}
      </ReactMarkdown>
    </div>
  );
}
