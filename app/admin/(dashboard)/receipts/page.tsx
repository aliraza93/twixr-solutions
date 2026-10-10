import { ListPage } from "@/components/admin/list-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/admin/status-badge";
import {
  deleteReceipt,
  listReceipts,
  saveReceipt,
  toggleReceipt,
} from "@/lib/cms/receipts";

const KINDS = ["incident", "number", "decision", "artifact", "client"];

/**
 * Receipts admin.
 *
 * This is the one part of the content pipeline that cannot be automated: real
 * first-hand material has to be entered by the person it happened to. Keep the
 * form short enough to fill in during a coffee break, because the bank only
 * grows if adding to it is trivial.
 */
export default async function AdminReceiptsPage() {
  const receipts = await listReceipts();
  const active = receipts.filter((r) => r.active);

  return (
    <ListPage
      title="Receipts"
      subtitle="Real, verified, anonymized material from actual work. The only source of first-hand claims the generator is allowed to use."
      table={
        <div className="space-y-6">
          <Card variant="base" className="p-5 hover:translate-y-0">
            <p className="text-sm text-muted-foreground">
              {active.length} active of {receipts.length} total.{" "}
              {active.length === 0
                ? "With none active, every post is written with no first-hand experience in it."
                : "Each generated post draws one or two of these and may make no other personal claims."}
            </p>
          </Card>

          <Card variant="base" className="p-5 hover:translate-y-0">
            <h2 className="font-sora text-base font-semibold">Add a receipt</h2>
            <form action={saveReceipt} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cluster">Cluster</Label>
                  <Input
                    id="cluster"
                    name="cluster"
                    placeholder="Laravel, AWS, Databases, Upwork..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kind">Kind</Label>
                  <select
                    id="kind"
                    name="kind"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    defaultValue="incident"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">What happened (one line)</Label>
                <Input
                  id="summary"
                  name="summary"
                  required
                  placeholder="N+1 on the invoice listing: 900 queries down to 6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="detail">
                  Specifics: numbers, log lines, query plans, versions
                </Label>
                <textarea
                  id="detail"
                  name="detail"
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent p-3 text-sm"
                  placeholder="Eager loading was missing on two relations. p95 went from 2.4s to 310ms. Laravel 11, Postgres 15."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome">What changed afterwards</Label>
                <textarea
                  id="outcome"
                  name="outcome"
                  rows={2}
                  className="w-full rounded-md border border-input bg-transparent p-3 text-sm"
                  placeholder="Added a query-count assertion to the test suite so it cannot regress."
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked />
                Active (available to the generator)
              </label>

              <p className="text-xs text-muted-foreground">
                Never enter a client name or anything identifying. Keep every
                number exact: the generator is instructed not to round or
                embellish, and it cannot verify what it is given.
              </p>

              <Button type="submit">Save receipt</Button>
            </form>
          </Card>

          <div className="space-y-3">
            {receipts.map((receipt) => (
              <Card key={receipt.id} variant="base" className="p-4 hover:translate-y-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={receipt.active ? "active" : "pending"} />
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                        {receipt.kind}
                        {receipt.cluster ? ` / ${receipt.cluster}` : ""}
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        used {receipt.usedCount}x
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{receipt.summary}</p>
                    {receipt.detail && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {receipt.detail}
                      </p>
                    )}
                    {receipt.outcome && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Outcome: {receipt.outcome}
                      </p>
                    )}
                    {!receipt.detail && (
                      <p className="mt-1 text-xs text-amber-600">
                        No specifics yet. Add them before activating, or a post
                        will anchor on a bare summary.
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={toggleReceipt}>
                      <input type="hidden" name="id" value={receipt.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        {receipt.active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                    <form action={deleteReceipt}>
                      <input type="hidden" name="id" value={receipt.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Delete
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      }
    />
  );
}
