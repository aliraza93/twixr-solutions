"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { Inquiry, InquiryStatus } from "@/lib/cms/types";
import { saveInquiryStatusAction } from "@/app/admin/actions";
import { StatusPill } from "@/components/admin/status-pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const STATUSES: InquiryStatus[] = ["unread", "read", "replied", "archived"];

export function InquiryDetail({ inquiry }: { inquiry: Inquiry | null }) {
  const [pending, start] = useTransition();

  if (!inquiry) {
    return (
      <aside className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Select an inquiry to read the message.
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Inquiry
      </p>
      <h2 className="mt-2 text-lg font-semibold text-foreground">{inquiry.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{inquiry.email}</p>
      <div className="mt-3">
        <StatusPill status={inquiry.status} />
      </div>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Company</dt>
          <dd className="mt-1 text-foreground">{inquiry.company || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Project type</dt>
          <dd className="mt-1 text-foreground">{inquiry.projectType || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Message</dt>
          <dd className="mt-2 whitespace-pre-wrap rounded-md border border-border bg-secondary p-3 text-foreground">
            {inquiry.message}
          </dd>
        </div>
      </dl>
      <div className="mt-6 space-y-2">
        <Label htmlFor="inquiry-status">Status</Label>
        <Select
          disabled={pending}
          value={inquiry.status}
          onValueChange={(value) => {
            start(async () => {
              try {
                await saveInquiryStatusAction(inquiry.id, value as InquiryStatus);
                toast.success(`Marked ${value}`);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Update failed");
              }
            });
          }}
        >
          <SelectTrigger id="inquiry-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button asChild className="mt-6 w-full">
        <a href={`mailto:${inquiry.email}`}>Reply by email</a>
      </Button>
    </aside>
  );
}
