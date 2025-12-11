import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string; // Tambahkan prop className
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className }) => {
  return (
    <div className={`math-content prose prose-sm dark:prose-invert max-w-none ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
            // Custom styling for tables to ensure they look good in logs/toasts
            table: ({node, ...props}) => (
                <div className="overflow-x-auto my-2 rounded-md border border-border">
                    <table className="w-full text-xs text-left" {...props} />
                </div>
            ),
            th: ({node, ...props}) => (
                <th className="bg-muted px-3 py-1.5 font-semibold text-muted-foreground border-b border-border" {...props} />
            ),
            td: ({node, ...props}) => (
                <td className="px-3 py-1.5 border-b border-border/50" {...props} />
            ),
            p: ({node, ...props}) => (
                <p className="leading-relaxed mb-1" {...props} />
            ),
            strong: ({node, ...props}) => (
                <strong className="font-bold text-primary" {...props} />
            )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
