'use client';

import { useState } from 'react';

// Print or save the receipt as a PDF, or copy its link to send on.
export function ReceiptActions() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className="btn">
        Print or save as PDF
      </button>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="btn btn-ghost"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
    </div>
  );
}
