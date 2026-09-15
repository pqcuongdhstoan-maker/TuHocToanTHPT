import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  text?: string;
  className?: string;
  inline?: boolean;
}

/**
 * MathView renders mixed text and LaTeX mathematical formulas.
 * Supports:
 * - Inline math: $formula$
 * - Block math: $$formula$$ or \[formula\]
 * Uses KaTeX with automatic fallback to prevent crashes.
 */
export const MathView: React.FC<MathViewProps> = ({
  text = '',
  className = '',
  inline = false,
}) => {
  const renderedContent = useMemo(() => {
    if (!text) return null;

    // Tokenize text into regular text and LaTeX blocks
    // Matches $$...$$, \[...\], \(...\), and $...$
    const tokens: Array<{ type: 'text' | 'inline-math' | 'block-math'; content: string }> = [];
    const regex = /(\$\$(?:[\s\S]*?)\$\$|\\\[(?:[\s\S]*?)\\\]|\\\((?:[\s\S]*?)\\\)|\$(?:[^\$\n]+?)\$)/g;
    
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Text preceding match
      if (match.index > lastIndex) {
        tokens.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
        });
      }

      const matchStr = match[0];
      if (matchStr.startsWith('$$') && matchStr.endsWith('$$')) {
        tokens.push({
          type: 'block-math',
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith('\\[') && matchStr.endsWith('\\]')) {
        tokens.push({
          type: 'block-math',
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith('\\(') && matchStr.endsWith('\\)')) {
        tokens.push({
          type: 'inline-math',
          content: matchStr.slice(2, -2).trim(),
        });
      } else if (matchStr.startsWith('$') && matchStr.endsWith('$')) {
        tokens.push({
          type: 'inline-math',
          content: matchStr.slice(1, -1).trim(),
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex),
      });
    }

    return tokens.map((token, index) => {
      if (token.type === 'text') {
        // Handle newlines
        const lines = token.content.split('\n');
        return (
          <span key={index}>
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {line}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      }

      const isBlock = token.type === 'block-math' && !inline;

      try {
        const html = katex.renderToString(token.content, {
          displayMode: isBlock,
          throwOnError: false,
          strict: false,
          output: 'html',
        });

        if (isBlock) {
          return (
            <div
              key={index}
              className="my-3 overflow-x-auto py-1 text-center scrollbar-thin"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={index}
            className="inline-math px-0.5 inline-block align-baseline font-serif"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        return (
          <code
            key={index}
            className="bg-amber-50 text-amber-800 px-1 py-0.5 rounded text-xs border border-amber-200"
          >
            {token.content}
          </code>
        );
      }
    });
  }, [text, inline]);

  if (inline) {
    return <span className={`math-view-inline ${className}`}>{renderedContent}</span>;
  }

  return (
    <div className={`math-view leading-relaxed text-slate-800 ${className}`}>
      {renderedContent}
    </div>
  );
};

export default MathView;
