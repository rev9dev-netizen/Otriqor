/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = React.memo(({ content }: MarkdownRendererProps) => {
  // Fix LaTeX incompatible characters (e.g. en-dash to hyphen)
  const safeContent = React.useMemo(() => {
    return content.replace(/–/g, '-');
  }, [content]);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <div className="relative rounded-xl overflow-hidden my-2 border border-white/10">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] text-xs text-white text-stone-400 select-none">
                    <span>{match[1]}</span>
                    <button 
                        onClick={() => navigator.clipboard.writeText(String(children))} 
                        className="hover:text-white"
                    >
                        Copy
                    </button>
                </div>
                <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                codeTagProps={{ style: { fontFamily: '"Funnel Sans", sans-serif' } }}
                customStyle={{ 
                    margin: 0, 
                    borderRadius: 0, 
                    borderBottomLeftRadius: '0.375rem', 
                    borderBottomRightRadius: '0.375rem',
                    fontFamily: '"Funnel Sans", sans-serif' 
                }}
                {...props}
                >
                {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
          ) : (
            <code className={`${className} bg-black/10 dark:bg-white/10 rounded px-1 py-0.5 text-sm`} {...props}>
              {children}
            </code>
          );
        },
        table({ children }) {
            return <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-white/10 text-sm">{children}</table></div>;
        },
        thead({ children }) {
            return <thead className="bg-white/5">{children}</thead>;
        },
        th({ children }) {
            return <th className="border border-white/10 px-4 py-2 text-left font-semibold">{children}</th>;
        },
        td({ children }) {
            return <td className="border border-white/10 px-4 py-2">{children}</td>;
        },
        a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>
        },
        p({ children }) {
            return <p className="leading-7 [&:not(:first-child)]:mt-6 mb-1">{children}</p>;
        },
        h1({ children }) {
            return <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl mt-8 mb-4">{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0 mt-8 mb-4">{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3">{children}</h3>;
        },
        h4({ children }) {
            return <h4 className="scroll-m-20 text-lg font-semibold tracking-tight mt-6 mb-3">{children}</h4>;
        },
        ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
        }
      }}
    >
      {safeContent}
    </ReactMarkdown>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";
