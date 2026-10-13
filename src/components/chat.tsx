'use client';

import { useChat } from '@ai-sdk/react';
import type { CarePlan } from '@/lib/plans';
import { PlanCard } from './plan-card';

const starters = [
  "Order Mum's blood-pressure medicine in Enugu",
  'My dad in Lagos needs malaria tablets',
  'Metformin for my aunt in Abuja',
];

export function Chat() {
  const { messages, input, setInput, handleInputChange, handleSubmit, status, error, append } = useChat();
  const busy = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col">
      <div className="mx-auto w-full max-w-[720px] flex-1 space-y-4 p-4 pb-32">
        {messages.length === 0 && (
          <div className="pt-12 sm:pt-20">
            <p className="label text-text-muted">New order</p>
            <h1 className="mt-3 text-[36px] leading-[1.05] font-semibold sm:text-[52px]">
              What medicine does she need?
            </h1>
            <p className="mt-3 max-w-[46ch] text-text-muted">
              Tell me the medicine and the city. I&rsquo;ll find a verified pharmacy, and you approve the payment.
            </p>
            <div className="mt-8 flex flex-col gap-2">
              {starters.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => append({ role: 'user', content: text })}
                  className="group flex min-h-12 items-center justify-between rounded-control border border-border bg-surface px-4 text-left text-sm transition-colors hover:border-text"
                >
                  {text}
                  <span aria-hidden className="text-text-muted transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
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
                    className={`w-fit max-w-[85%] whitespace-pre-wrap px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'ml-auto rounded-[20px] rounded-br-md bg-primary text-on-primary'
                        : 'rounded-[20px] rounded-bl-md bg-surface-muted'
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
                    <p key={i} className="label flex items-center gap-2 text-text-muted">
                      <span className="block size-1.5 rotate-45 animate-pulse bg-signal" />
                      {call.toolName === 'search_pharmacies' ? 'Finding pharmacies' : 'Working'}
                    </p>
                  );
                }
                if (call.toolName === 'draft_order' && !('error' in call.result)) {
                  return <PlanCard key={i} plan={call.result as CarePlan} />;
                }
              }
              return null;
            })}
          </div>
        ))}

        {status === 'submitted' && (
          <p className="label flex items-center gap-2 text-text-muted">
            <span className="block size-1.5 rotate-45 animate-pulse bg-signal" />
            Thinking
          </p>
        )}
        {error && (
          <p className="rounded-control border border-danger px-4 py-3 text-sm text-danger">
            I couldn&rsquo;t reply just now. Nothing was charged. {error.message}
          </p>
        )}
      </div>

      <form
        onSubmit={(event) => {
          handleSubmit(event);
          setInput('');
        }}
        className="fixed inset-x-0 bottom-0 bg-linear-to-t from-bg from-70% to-transparent p-4 pt-8"
      >
        <div className="mx-auto flex max-w-[720px] items-center gap-2 rounded-full border border-border bg-surface p-1.5 pl-5 shadow-[0_8px_30px_rgb(10_11_13/0.08)] focus-within:border-text">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Which medicine, and for whom?"
            aria-label="Message"
            className="min-h-11 flex-1 bg-transparent outline-none placeholder:text-text-muted"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn px-5">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
