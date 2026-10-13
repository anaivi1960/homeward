import Link from 'next/link';
import { Brand } from '@/components/brand';
import { HeroScene } from '@/components/landing/hero-scene';

const steps = [
  {
    n: '01',
    title: 'Say what she needs',
    body: 'Tell Homeward the medicine and the city. It finds a verified pharmacy nearby and shows you the price.',
  },
  {
    n: '02',
    title: 'Approve with PayPal',
    body: 'You pay the pharmacy directly. No cash changes hands at home, and nobody has to run the errand.',
  },
  {
    n: '03',
    title: 'See it picked up',
    body: 'She collects with a one-time code. The moment the pharmacy confirms it, you see it.',
  },
];

const timeline = [
  { time: '9:14 AM', text: 'You approved $18.40 to Ndidi Pharmacy', done: true },
  { time: '9:14 AM', text: 'Pickup code sent to Mum', done: true },
  { time: '3:14 PM', text: 'Mum picked it up in Enugu', done: true },
];

export default function Landing() {
  return (
    <div className="overflow-x-clip">
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4">
        <Brand />
        <Link href="/app" className="btn btn-ghost min-h-10! px-4! text-sm">
          Open app
        </Link>
      </header>

      <main>
        <section className="dot-grid relative">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-bg via-transparent to-bg" />
          <div className="relative mx-auto max-w-[1120px] px-4 pt-14 text-center sm:pt-20">
            <p className="label inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-text-muted">
              <span className="block size-1.5 rotate-45 bg-signal" />
              Houston → Enugu · Paid with PayPal
            </p>
            <h1 className="mx-auto mt-6 max-w-[14ch] text-[44px] leading-[1.02] font-semibold sm:text-[76px]">
              Mum&rsquo;s medicine, handled from here.
            </h1>
            <p className="mx-auto mt-5 max-w-[52ch] text-lg text-text-muted">
              Order medicine from a verified pharmacy in Nigeria, pay it directly, and see the moment it&rsquo;s picked up.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/app" className="btn">
                Order medicine
              </Link>
              <a href="#how" className="btn btn-ghost">
                How it works
              </a>
            </div>
          </div>
          <div className="relative mx-auto max-w-[1280px]">
            <HeroScene />
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1120px] px-4 py-20">
          <p className="label text-text-muted">How it works</p>
          <h2 className="mt-3 max-w-[20ch] text-[32px] leading-[1.1] font-semibold sm:text-[44px]">
            Three steps. No cash, no errands.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.n} className="card p-6">
                <p className="label text-accent">{step.n}</p>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-surface-muted">
          <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-4 py-20 sm:grid-cols-2">
            <div>
              <p className="label text-text-muted">Proof, not promises</p>
              <h2 className="mt-3 text-[32px] leading-[1.1] font-semibold sm:text-[44px]">
                Know it reached her.
              </h2>
              <p className="mt-4 max-w-[44ch] text-text-muted">
                Every order ends with a pickup confirmation from the pharmacy, timestamped and tied to a code only she has.
              </p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Amlodipine 10mg · 30 tablets</p>
                <span className="label rounded-full bg-signal/15 px-2.5 py-1 text-accent">Picked up</span>
              </div>
              <ol className="mt-6 space-y-5">
                {timeline.map((row) => (
                  <li key={row.text} className="flex gap-4">
                    <span className="mt-1.5 block size-2 shrink-0 rotate-45 bg-signal" />
                    <div>
                      <p>{row.text}</p>
                      <p className="label mt-0.5 text-text-muted">{row.time}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] px-4 py-24 text-center">
          <h2 className="mx-auto max-w-[16ch] text-[36px] leading-[1.05] font-semibold sm:text-[56px]">
            Be there, from wherever you are.
          </h2>
          <Link href="/app" className="btn mt-8">
            Order medicine
          </Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-4 py-6">
          <Brand />
          <p className="label text-text-muted">Sandbox demo · No real money moves · PayPal AI Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
