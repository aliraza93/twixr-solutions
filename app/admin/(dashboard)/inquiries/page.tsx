import Link from "next/link";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInquiries } from "@/lib/cms/inquiries";
import { InquiryDetail } from "@/components/admin/inquiry-detail";
import type { InquiryStatus } from "@/lib/cms/types";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; status?: string }>;
}) {
  const { id, status } = await searchParams;
  const inquiries = await listInquiries();
  const filter = (status as InquiryStatus | undefined) ?? "all";
  const rows =
    filter === "all" ? inquiries : inquiries.filter((item) => item.status === filter);
  const selected = inquiries.find((item) => item.id === id) ?? null;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inbox"
        title="Contact queries"
        description="Leads from the public contact form. Email is still sent via Resend."
      />

      <div className="flex flex-wrap gap-2">
        {["all", "unread", "read", "replied", "archived"].map((value) => (
          <Link
            key={value}
            href={value === "all" ? "/admin/inquiries" : `/admin/inquiries?status=${value}`}
            className={`rounded-pill border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
              filter === value
                ? "border-pine bg-pine-tint text-pine"
                : "border-hairline text-muted hover:border-pine hover:text-pine"
            }`}
          >
            {value}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {rows.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No inquiries"
            description="New contact form submissions will appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <Link
                      href={`/admin/inquiries?id=${inquiry.id}${filter !== "all" ? `&status=${filter}` : ""}`}
                      className="font-medium text-ink hover:text-pine"
                    >
                      {inquiry.name}
                    </Link>
                    <p className="text-xs text-muted">{inquiry.email}</p>
                  </TableCell>
                  <TableCell>{inquiry.projectType || "—"}</TableCell>
                  <TableCell>
                    <StatusPill status={inquiry.status} />
                  </TableCell>
                  <TableCell className="text-muted">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <InquiryDetail inquiry={selected} />
      </div>
    </div>
  );
}
