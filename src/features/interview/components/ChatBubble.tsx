import { useEffect, useRef } from 'react';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

interface ChatBubbleProps {
  role: 'sys' | 'usr';
  text: string;
  signal?: { color: string; text: string };
  streaming?: boolean;
}

export function ChatBubble({ role, text, signal, streaming = false }: ChatBubbleProps) {
  const isSys = role === 'sys';

  return (
    <div className={clsx('flex flex-col gap-1.5', isSys ? 'items-start' : 'items-end')}>
      <div
        className={clsx(
          'max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
          isSys
            ? 'bg-slate-800/70 text-slate-200 rounded-tl-sm'
            : 'bg-amber-950/60 border border-amber-900/30 text-amber-100 rounded-tr-sm',
        )}
      >
        {text}
        {streaming && (
          <span className="inline-block w-1 h-3.5 bg-amber-500 ml-0.5 animate-pulse rounded-sm align-middle" />
        )}
      </div>

      {signal && isSys && (
        <div className="flex items-center gap-1.5 ml-1">
          <div
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: signal.color, boxShadow: `0 0 6px ${signal.color}80` }}
          />
          <span className="text-[10px] text-slate-700 font-light">{signal.text}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TypingIndicator
// ---------------------------------------------------------------------------

export function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-slate-800/70 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// useChatScroll
// ---------------------------------------------------------------------------

export function useChatScroll(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
