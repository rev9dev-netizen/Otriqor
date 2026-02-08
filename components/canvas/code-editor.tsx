"use client";

import * as React from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
    value: string;
    language: string;
    onChange: (value: string) => void;
}

export const CodeEditor = ({ value, language, onChange }: CodeEditorProps) => {
    return (
        <div className="relative w-full h-full font-mono text-sm leading-relaxed group">
            {/* Syntax Highlighter (Background) */}
            <div 
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
            >
                <SyntaxHighlighter
                    language={language === 'html' ? 'html' : language === 'python' ? 'python' : 'markdown'}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: '1.5rem', // Match textarea padding
                        height: '100%',
                        width: '100%',
                        background: 'transparent',
                        fontSize: '0.875rem', // text-sm
                        lineHeight: '1.625',   // leading-relaxed
                        overflow: 'hidden', // Sync scroll is hard, actually...
                    }}
                    codeTagProps={{
                        style: {
                            fontFamily: 'monospace',
                        }
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>

            {/* Textarea (Foreground - Editing) */}
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full p-6 bg-transparent text-transparent caret-white border-0 resize-none focus:ring-0 outline-none z-10 font-mono text-sm leading-relaxed"
                spellCheck={false}
                style={{
                    color: 'transparent',
                    caretColor: 'white',
                }}
            />
        </div>
    );
};
