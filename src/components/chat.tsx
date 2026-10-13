'use client';

import { useChat } from '@ai-sdk/react';
import type { CarePlan } from '@/lib/plans';
import { PlanCard } from './plan-card';

const starters = [
  "Pay for Mum's blood-pressure medicine in Enugu",
  "Cover my brother's school fees this term",
  'Send a monthly provisions basket to my aunt in Lagos',
];

export function Chat() {
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error, append } = useChat();
  const busy = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-[640px] flex-1 space-y-4 p-4 pt-8 pb-32">
        <p className="font-display text-xl font-semibold text-primary">Homeward</p>

        {messages.length === 0 && (
          <div className="pt-8">
            <h1 className="font-display text-[32px] leading-[38px] font-semibold">
              What does family at home need?
            </h1>
            <p className="mt-2 text-text-muted">
              Tell me what to cover. I&rsquo;ll find a trusted merchant, and you approve the payment.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {starters.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => append({ role: 'user', content: text })}
                  className="min-h-11 rounded-control border border-border bg-surface px-4 text-left text-sm"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {message.parts.map((part, i) => {
              if (part.type === 'text' && part.text) {
                return (
                  <p
                    key={i}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-card px-4 py-3 ${
                      message.role === 'user'
                        ? 'ml-auto w-fit bg-surface-muted'
                        : 'w-fit border border-border bg-surface'
                    }`}
                  >
                    {part.text}
                  </p>
                );
              }
              if (part.type === 'tool-invocation') {
                const call = part.toolInvocation;
                if (call.state !== 'result') {
                  return (
                    <p key={i} className="text-sm text-text-muted">
                      {call.toolName === 'search_merchants' ? 'Looking for merchants…' : 'Working on it…'}
                    </p>
                  );
                }
                if (call.toolName === 'draft_care_plan' && !('error' in call.result)) {
                  return <PlanCard key={i} plan={call.result as CarePlan} />;
                }
              }
              return null;
            })}
          </div>
        ))}

        {status === 'submitted' && <p className="text-sm text-text-muted">Thinking…</p>}
        {error && (
          <p className="rounded-card border border-danger px-4 py-3 text-sm text-danger">
            I couldn&rsquo;t reply just now. Nothing was charged. {error.message}
          </p>
        )}
      </div>

      <form
        onSubmit={(event) => {
          handleSubmit(event);
          setInput('');
        }}
        className="fixed inset-x-0 bottom-0 border-t border-border bg-bg p-4"
      >
        <div className="mx-auto flex max-w-[640px] gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="What should I cover, and for whom?"
            aria-label="Message"
            className="min-h-11 flex-1 rounded-control border border-border bg-surface px-4 outline-primary"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="min-h-11 rounded-control bg-primary px-5 font-semibold text-on-primary disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
