'use client';

import { useState } from 'react';

// The pickup link the payer passes on to their family member.
export function ShareLink({ url, message }: { url: string; message: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4">
      <a href={url} className="block rounded-control bg-surface-muted px-4 py-3 font-mono text-sm break-all hover:text-accent">
        {url}
      </a>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="btn">
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
        >
          Send on WhatsApp
        </a>
      </div>
    </div>
  );
}
