import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className, compact }) => {
  return (
    <div className={`math-content prose dark:prose-invert max-w-none ${compact ? 'prose-xs leading-tight' : 'prose-sm'} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
            table: ({node, ...props}) => (
                <div className="overflow-x-auto my-1 rounded border border-border bg-card/50">
                    <table className={`w-full text-left ${compact ? 'text-[10px]' : 'text-xs'}`} {...props} />
                </div>
            ),
            thead: ({node, ...props}) => (
                <thead className="bg-muted/50" {...props} />
            ),
            th: ({node, ...props}) => (
                <th className={`font-semibold border-b border-border ${compact ? 'px-2 py-1' : 'px-3 py-2'}`} {...props} />
            ),
            td: ({node, ...props}) => (
                <td className={`border-b border-border/50 last:border-0 ${compact ? 'px-2 py-1' : 'px-3 py-2'}`} {...props} />
            ),
            p: ({node, ...props}) => (
                <p className={`text-muted-foreground ${compact ? 'text-[11px] mb-1' : 'mb-2'}`} {...props} />
            ),
            h3: ({node, ...props}) => (
                <h3 className={`font-bold text-foreground ${compact ? 'text-xs mb-1 mt-2 first:mt-0' : 'text-sm mb-2 mt-4 first:mt-0'}`} {...props} />
            ),
            li: ({node, ...props}) => (
                <li className={`${compact ? 'text-[11px]' : ''}`} {...props} />
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
