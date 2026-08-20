import Link from "next/link";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { InquiryDetail } from "@/components/admin/inquiry-detail";
import { ListPage } from "@/components/admin/list-page";
import { DataToolbar, ToolbarSegment } from "@/components/admin/data-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listInquiries } from "@/lib/cms/inquiries";
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
  const query = filter === "all" ? "" : `&status=${filter}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ListPage
        title="Inquiries"
        subtitle="Leads from the public contact form. Email is still sent via Resend."
        toolbar={
          <DataToolbar
            segments={
              <>
                {(["all", "unread", "read", "replied", "archived"] as const).map((value) => (
                  <ToolbarSegment
                    key={value}
                    href={value === "all" ? "/admin/inquiries" : `/admin/inquiries?status=${value}`}
                    active={filter === value}
                  >
                    {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
                  </ToolbarSegment>
                ))}
              </>
            }
          >
            <span className="text-xs text-muted-foreground tabular-nums">
              {rows.length} {rows.length === 1 ? "result" : "results"}
            </span>
          </DataToolbar>
        }
        table={
          <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
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
                    <TableRow
                      key={inquiry.id}
                      className={inquiry.id === selected?.id ? "bg-accent/60" : undefined}
                    >
                      <TableCell>
                        <Link
                          href={`/admin/inquiries?id=${inquiry.id}${query}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {inquiry.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inquiry.projectType || "—"}
                      </TableCell>
                      <TableCell>
                        <StatusPill status={inquiry.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(inquiry.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <InquiryDetail inquiry={selected} />
          </div>
        }
      />
    </div>
  );
}
