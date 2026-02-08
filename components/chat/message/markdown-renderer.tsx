/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { StockCard, StockSkeleton } from '@/components/chat/Widgets/stock-card';
import { ImageCarousel, GallerySkeleton } from '@/components/chat/Widgets/image-carousel';
import { WeatherCard, WeatherSkeleton } from '@/components/chat/Widgets/weather-card';
import { canvasStore } from "@/lib/store/canvas-store";
import { Copy, FileCode } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = React.memo(({ content }: MarkdownRendererProps) => {
  // Fix LaTeX incompatible characters (e.g. en-dash to hyphen)
  // Fix LaTeX incompatible characters (e.g. en-dash to hyphen)
  // Also escape dollar signs that are likely currency ($ followed by digit) to prevent accidental math mode
  const safeContent = React.useMemo(() => {
    return content
        .replace(/–/g, '-')
        .replace(/(?<!\$)\$(?=\d)/g, '\\$'); // Escape $ if followed by a digit
  }, [content]);

  return (
    <div className="max-w-3xl">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const isFinance = match && match[1] === 'finance';
          const isWeather = match && match[1] === 'weather';
          const isGallery = match && match[1] === 'gallery';
          
          if (!inline && isFinance) {
              try {
                  const data = JSON.parse(String(children).replace(/\n$/, ''));
                  return <div className='my-4'><StockCard data={data} /></div>;
              } catch (e) {
                  return <div className='my-4'><StockSkeleton /></div>;
              }
          }

          if (!inline && isWeather) {
              try {
                  const data = JSON.parse(String(children).replace(/\n$/, ''));
                  return <div className='my-4'><WeatherCard data={data} /></div>;
              } catch (e) {
                  return <div className='my-4'><WeatherSkeleton /></div>;
              }
          }

          if (!inline && isGallery) {
              // Parse markdown image syntax: ![alt](url)
              const content = String(children);
              const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
              const images = [];
              let m;
              while ((m = imageRegex.exec(content)) !== null) {
                  images.push({ alt: m[1], src: m[2] });
              }
              
              if (images.length > 0) {
                  return <ImageCarousel images={images} />;
              }
              // Show skeleton if we have the block but no images parsed yet (streaming)
              return <GallerySkeleton />;
          }

          return !inline && match ? (
            <div className="relative rounded-xl overflow-hidden my-2 border border-white/10 group">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] text-xs text-stone-400 select-none border-b border-white/5">
                    <span>{match[1]}</span>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => canvasStore.openWithContent(String(children), match[1])}
                            className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                            title="Open in Canvas"
                        >
                            <FileCode className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline-block">Canvas</span>
                        </button>
                        <div className="h-3 w-px bg-white/10 opacity-0 group-hover:opacity-100" />
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(String(children));
                                // Optional: Toast feedback here
                            }} 
                            className="flex items-center gap-1.5 text-xs font-medium text-stone-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline-block">Copy</span>
                        </button>
                    </div>
                </div>
                <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                codeTagProps={{ style: { fontFamily: '"Funnel Sans", sans-serif' } }}
                customStyle={{ 
                    margin: 0, 
                    borderRadius: 0, 
                    background: '#1e1e1e',
                    fontFamily: '"Funnel Sans", sans-serif' 
                }}
                {...props}
                >
                {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            </div>
          ) : (
            <code className={`${className} bg-white/10 rounded px-1.5 py-0.5 text-sm font-medium text-neutral-200`} {...props}>
              {children}
            </code>
          );
        },
        table({ children }) {
            return <div className="overflow-x-auto my-6 rounded-lg border border-white/10"><table className="min-w-full text-left text-sm">{children}</table></div>;
        },
        thead({ children }) {
            return <thead className="bg-white/5 text-neutral-300 font-medium border-b border-white/5">{children}</thead>;
        },
        th({ children }) {
            return <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-neutral-400 select-none">{children}</th>;
        },
        td({ children }) {
            return <td className="px-4 py-3 border-b border-white/5 text-neutral-300 first:font-medium first:text-neutral-200">{children}</td>;
        },
        a({ href, children }) {
            return (
                <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-white/80 hover:text-white underline decoration-white/20 hover:decoration-white/50 transition-colors font-medium break-all"
                >
                    {children}
                </a>
            )
        },
        img({ src, alt }) {
            return (
                <span className="block my-8 group">
                    <span className="block relative rounded-lg overflow-hidden border border-white/10 bg-white/5 max-w-full shadow-sm transition-shadow hover:shadow-md">
                        <img 
                            src={src} 
                            alt={alt} 
                            className="w-full h-auto object-cover max-h-[400px] opacity-90 group-hover:opacity-100 transition-opacity"
                            loading="lazy"
                        />
                    </span>s
                    {alt && <span className="block text-xs text-neutral-500 mt-2 italic">{alt}</span>}
                </span>
            );
        },
        ul({ children }) {
            return <ul className="list-disc ml-5 space-y-1.5 my-3 marker:opacity-70">{children}</ul>;
        },
        ol({ children }) {
            return <ol className="list-decimal ml-5 space-y-1.5 my-3 marker:opacity-70">{children}</ol>;
        },
        li({ children }) {
            return <li className="pl-1">{children}</li>;
        },
        hr({ children }) {
            // Opinionated: Replace visible HR with whitespace for a cleaner "editorial" look
            return <div className="my-8" />;
        },
        p({ children }) {
            return <p className="leading-relaxed [&:not(:first-child)]:mt-4">{children}</p>;
        },
        pre({ children   }) {
            return <div className="not-prose my-4">{children}</div>;
        },
        h1({ children }) {
            return <h1 className="text-2xl font-semibold tracking-tight mt-6 mb-3">{children}</h1>;
        },
        h2({ children }) {
            return <h2 className="text-lg font-semibold mt-8 mb-2 tracking-tight">{children}</h2>;
        },
        h3({ children }) {
            return <h3 className="text-base font-medium opacity-90 mt-6 mb-1">{children}</h3>;
        },
        h4({ children }) {
            return <h4 className="text-sm font-medium opacity-80 mt-6 mb-1 uppercase tracking-wide">{children}</h4>;
        }
      }}
    >
      {safeContent}
    </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";
