"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { Inquiry, InquiryStatus } from "@/lib/cms/types";
import { saveInquiryStatusAction } from "@/app/admin/actions";
import { StatusPill } from "@/components/admin/status-pill";
import { Button } from "@/components/ui/button";

const STATUSES: InquiryStatus[] = ["unread", "read", "replied", "archived"];

export function InquiryDetail({ inquiry }: { inquiry: Inquiry | null }) {
  const [pending, start] = useTransition();

  if (!inquiry) {
    return (
      <aside className="rounded-lg border border-dashed border-hairline-strong bg-surface p-6 text-sm text-muted">
        Select an inquiry to read the message.
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-hairline bg-canvas p-6 shadow-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pine">
        Inquiry
      </p>
      <h2 className="mt-2 font-sora text-xl font-bold text-ink">{inquiry.name}</h2>
      <p className="mt-1 text-sm text-muted">{inquiry.email}</p>
      <div className="mt-3">
        <StatusPill status={inquiry.status} />
      </div>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Company
          </dt>
          <dd className="mt-1 text-ink">{inquiry.company || "—"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Project type
          </dt>
          <dd className="mt-1 text-ink">{inquiry.projectType || "—"}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Message
          </dt>
          <dd className="mt-2 whitespace-pre-wrap rounded-md bg-surface p-3 text-ink">
            {inquiry.message}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={pending || inquiry.status === status}
            className="cursor-pointer rounded-pill border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:border-pine hover:text-pine disabled:opacity-40"
            onClick={() => {
              start(async () => {
                try {
                  await saveInquiryStatusAction(inquiry.id, status);
                  toast.success(`Marked ${status}`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Update failed");
                }
              });
            }}
          >
            {status}
          </button>
        ))}
      </div>
      <Button asChild variant="primary" className="mt-6 w-full">
        <a href={`mailto:${inquiry.email}`}>Reply by email</a>
      </Button>
    </aside>
  );
}
