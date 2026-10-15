'use client';

import { useChat } from '@ai-sdk/react';
import { type FormEvent, useRef, useState } from 'react';
import type { CarePlan } from '@/lib/plans';
import { shrinkImage } from '@/lib/shrink-image';
import { PageIntro } from './page-intro';
import { PlanCard } from './plan-card';

const starters = [
  "Order Mum's blood-pressure medicine in Enugu",
  'My dad in Lagos needs malaria tablets',
  'Metformin for my aunt in Abuja',
];

type Photo = { name: string; url: string };

export function Chat() {
  const { messages, input, setInput, handleInputChange, status, error, append } = useChat();
  const busy = status === 'submitted' || status === 'streaming';
  const [photo, setPhoto] = useState<Photo>();
  const [reading, setReading] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  async function choose(file: File | undefined) {
    if (!file) return;
    setReading(true);
    try {
      setPhoto({ name: file.name, url: await shrinkImage(file, 1600, 0.85) });
    } finally {
      setReading(false);
      if (picker.current) picker.current.value = '';
    }
  }

  function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim() || (photo ? 'Here is the prescription.' : '');
    if (!text || busy) return;
    void append({
      role: 'user',
      content: text,
      experimental_attachments: photo ? [{ name: photo.name, contentType: 'image/jpeg', url: photo.url }] : undefined,
    });
    setInput('');
    setPhoto(undefined);
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col">
      <div className="mx-auto w-full max-w-[720px] flex-1 space-y-4 p-4 pb-40">
        {messages.length === 0 && (
          <div className="pt-8 sm:pt-14">
            <PageIntro eyebrow="New order" title="What medicine do they need?" model="/models/tile-medicine.glb">
              <p className="mt-3 max-w-[40ch] text-text-muted">
                Tell me the medicine and the city, or send a photo of the prescription. I&rsquo;ll find a verified
                pharmacy, and you approve the payment.
              </p>
            </PageIntro>
            <p className="label mt-10 text-text-muted">Try one of these</p>
            <div className="mt-3 flex flex-col gap-2">
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
              <button
                type="button"
                onClick={() => picker.current?.click()}
                className="group flex min-h-12 items-center justify-between rounded-control border border-dashed border-text-muted bg-surface px-4 text-left text-sm transition-colors hover:border-text"
              >
                <span>
                  <span className="font-medium">Send a photo of the prescription</span>
                  <span className="text-text-muted"> · I&rsquo;ll read the medicine and strength for you to check</span>
                </span>
                <span aria-hidden className="text-text-muted">
                  ＋
                </span>
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {message.experimental_attachments
              ?.filter((file) => file.contentType?.startsWith('image/'))
              .map((file, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- a data URL from the payer's own upload
                <img
                  key={i}
                  src={file.url}
                  alt="Prescription photo sent to the assistant"
                  className="ml-auto block max-h-56 w-auto rounded-[20px] rounded-br-md border border-border"
                />
              ))}
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
            {messages.at(-1)?.experimental_attachments?.length ? 'Reading the prescription' : 'Thinking'}
          </p>
        )}
        {error && (
          <p className="rounded-control border border-danger px-4 py-3 text-sm text-danger">
            I couldn&rsquo;t reply just now. Nothing was charged. {error.message}
          </p>
        )}
      </div>

      <form onSubmit={send} className="fixed inset-x-0 bottom-0 bg-linear-to-t from-bg from-70% to-transparent p-4 pt-8">
        <div className="mx-auto max-w-[720px]">
          {(photo || reading) && (
            <div className="mb-2 flex w-fit items-center gap-3 rounded-control border border-border bg-surface p-2 pr-3 shadow-sm">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen photo
                <img src={photo.url} alt="" className="size-12 rounded-md object-cover" />
              ) : (
                <span className="spinner size-6!" />
              )}
              <span className="text-sm">{photo ? 'Prescription photo ready to send' : 'Preparing photo'}</span>
              {photo && (
                <button type="button" onClick={() => setPhoto(undefined)} aria-label="Remove photo" className="text-text-muted hover:text-text">
                  ✕
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface p-1.5 pl-2 shadow-[0_8px_30px_rgb(10_11_13/0.08)] focus-within:border-text">
            <input
              ref={picker}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(event) => void choose(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => picker.current?.click()}
              aria-label="Attach a prescription photo"
              title="Attach a prescription photo"
              className="grid size-10 shrink-0 place-items-center rounded-full text-xl text-text-muted hover:bg-surface-muted hover:text-text"
            >
              ＋
            </button>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder={photo ? 'Add a note (optional)' : 'Which medicine, and for whom?'}
              aria-label="Message"
              name="message"
              className="min-h-11 flex-1 bg-transparent outline-none placeholder:text-text-muted"
            />
            <button type="submit" disabled={busy || reading || (!input.trim() && !photo)} className="btn px-5">
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
