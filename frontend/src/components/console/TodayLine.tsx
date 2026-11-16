import { Verdict, type VerdictJob } from "@/components/console/Verdict";

/**
 * The whole business in a sentence, before any numbers.
 *
 * The cards underneath are accurate and say nothing: four figures with no
 * ranking, so the owner has to work out for themselves whether today is
 * fine. This says it. If something needs doing it is named, in order of how
 * much it costs to ignore, with the link that does it.
 *
 * Deliberately written as plain sentences rather than labels, because the
 * person reading it has just opened a laptop between two other jobs.
 */
export function TodayLine({
  clients,
  overdueCount,
  overdueAmount,
  outstanding,
  openRequests,
  currency,
  money,
}: {
  clients: number;
  overdueCount: number;
  overdueAmount: string;
  outstanding: string;
  openRequests: number;
  currency: string;
  money: (amount: string | number, currency?: string) => string;
}) {
  const jobs: VerdictJob[] = [];

  if (overdueCount > 0) {
    jobs.push({
      text: `${overdueCount} invoice${overdueCount === 1 ? " is" : "s are"} overdue, ${money(
        overdueAmount,
        currency,
      )} in total. Chase ${overdueCount === 1 ? "it" : "them"}.`,
      href: "/dashboard/payments",
      action: "See who owes",
    });
  }

  if (openRequests > 0) {
    jobs.push({
      text: `${openRequests} client ${openRequests === 1 ? "request is" : "requests are"} waiting for an answer.`,
      href: "/dashboard/requests",
      action: "Answer them",
    });
  }

  const settled = jobs.length === 0;

  return (
    <Verdict
      settled={settled}
      title={settled ? "Nothing needs you today" : "Two minutes of work"}
      summary={
        settled ? (
          <>
            {clients} client{clients === 1 ? "" : "s"} on the books, every invoice is
            inside its due date and no one is waiting on a reply.
            {Number(outstanding) > 0
              ? ` ${money(outstanding, currency)} is still to come in, but none of it is late.`
              : ""}
          </>
        ) : undefined
      }
      jobs={jobs}
    />
  );
}
