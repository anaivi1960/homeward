import { problemReasons, type problemReports } from '@/db/schema';
import { formatTime } from './status-chip';

type Report = typeof problemReports.$inferSelect;

// How long the pharmacy has to answer a report.
const ANSWER_HOURS = 48;
export const answerBy = (report: Report) => new Date(report.createdAt.getTime() + ANSWER_HOURS * 3_600_000);

// Collapsed "Report a problem" form. `hidden` names the order: a paymentId or a family token.
export function ReportForm({ hidden, summary }: { hidden: { name: string; value: string }; summary: string }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-medium hover:text-accent">
        {summary} <span className="text-text-muted group-open:hidden">→</span>
      </summary>
      <form action="/api/orders/report" method="post" className="mt-4 flex flex-col gap-3">
        <input type="hidden" name={hidden.name} value={hidden.value} />
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="label mb-2 text-text-muted">What is wrong?</legend>
          {Object.entries(problemReasons).map(([value, label]) => (
            <label key={value} className="flex min-h-11 items-center gap-3 rounded-control border border-border px-4 has-checked:border-text">
              <input type="radio" name="reason" value={value} required className="accent-(--primary)" />
              {label}
            </label>
          ))}
        </fieldset>
        <textarea
          name="details"
          rows={3}
          maxLength={1000}
          placeholder="Anything the pharmacy should know (optional)"
          aria-label="Details"
          className="rounded-control border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-text"
        />
        <button type="submit" className="btn w-fit">
          Send to the pharmacy
        </button>
      </form>
    </details>
  );
}

// Where a report stands, for the payer and the family member.
export function ReportStatus({ report, pharmacy }: { report: Report; pharmacy: string }) {
  const reason = problemReasons[report.reason];
  const overdue = report.status === 'open' && answerBy(report) < new Date();
  const unsafe = report.reason === 'suspected_fake' || report.reason === 'expired';

  return (
    <div className="rounded-control bg-surface-muted p-4 text-sm">
      <p className="label text-text-muted">Problem reported · {reason}</p>
      <p className="mt-2">
        {report.status === 'replaced' && `${pharmacy} will replace it. Take the pack back to the counter.`}
        {report.status === 'refund' && `${pharmacy} agreed to refund the payment.`}
        {report.status === 'open' &&
          (overdue
            ? `${pharmacy} has not answered within ${ANSWER_HOURS} hours.`
            : `${pharmacy} has until ${formatTime(answerBy(report))} to replace it or refund it.`)}
      </p>
      {report.status === 'open' && unsafe && (
        <p className="mt-2 text-text-muted">Keep the pack and the receipt, and check with the pharmacist before taking any of it.</p>
      )}
    </div>
  );
}
