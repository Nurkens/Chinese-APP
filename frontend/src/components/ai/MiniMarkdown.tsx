import React from 'react';

/**
 * Tiny zero-dependency markdown renderer for chat replies.
 * Supports: paragraphs, line breaks, **bold**, *italic*, `inline code`,
 * ```fenced code blocks```, # / ## / ### headings, and "- " bullet lists.
 *
 * Deliberately simple — keeps bundle weight down and avoids any dangerous HTML.
 */

interface Props {
  text: string;
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const renderInline = (line: string): React.ReactNode => {
  // Tokenize: inline code first (to avoid bold/italic inside it), then bold, then italic.
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const push = (node: React.ReactNode) => tokens.push(<React.Fragment key={key++}>{node}</React.Fragment>);

  while (i < line.length) {
    if (line[i] === '`') {
      const end = line.indexOf('`', i + 1);
      if (end !== -1) {
        push(
          <code className="px-1.5 py-0.5 rounded bg-stone-900/70 border border-stone-700/60 text-amber-200 text-[0.92em]">
            {line.slice(i + 1, end)}
          </code>,
        );
        i = end + 1;
        continue;
      }
    }
    if (line[i] === '*' && line[i + 1] === '*') {
      const end = line.indexOf('**', i + 2);
      if (end !== -1) {
        push(<strong className="font-semibold text-white">{renderInline(line.slice(i + 2, end))}</strong>);
        i = end + 2;
        continue;
      }
    }
    if (line[i] === '*') {
      const end = line.indexOf('*', i + 1);
      if (end !== -1) {
        push(<em className="italic">{renderInline(line.slice(i + 1, end))}</em>);
        i = end + 1;
        continue;
      }
    }
    // Plain run — grab up to the next special char
    let j = i;
    while (j < line.length && line[j] !== '`' && line[j] !== '*') j++;
    push(line.slice(i, j));
    i = j;
  }
  return tokens;
};

const MiniMarkdown: React.FC<Props> = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const start = i + 1;
      let end = start;
      while (end < lines.length && !lines[end].trim().startsWith('```')) end++;
      blocks.push(
        <pre
          key={key++}
          className="my-2 p-3 rounded-xl bg-stone-950/80 border border-stone-700/60 overflow-x-auto text-[13px] leading-relaxed text-amber-100"
        >
          {lang && <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-1">{lang}</div>}
          <code dangerouslySetInnerHTML={{ __html: escape(lines.slice(start, end).join('\n')) }} />
        </pre>,
      );
      i = end + 1;
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const cls =
        level === 1
          ? 'text-lg font-semibold text-primary mt-3 mb-1'
          : level === 2
            ? 'text-base font-semibold text-primary mt-3 mb-1'
            : 'text-sm font-semibold text-primary mt-2 mb-1';
      blocks.push(
        <div key={key++} className={cls}>
          {renderInline(text)}
        </div>,
      );
      i++;
      continue;
    }

    // Bullet list — consume contiguous lines
    if (/^\s*[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-•]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-1 ml-5 list-disc space-y-1">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Blank line — paragraph break
    if (line.trim() === '') {
      blocks.push(<div key={key++} className="h-2" />);
      i++;
      continue;
    }

    blocks.push(
      <p key={key++} className="my-1 leading-relaxed">
        {renderInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="text-stone-100 text-[15px]">{blocks}</div>;
};

export default MiniMarkdown;
