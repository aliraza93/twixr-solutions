import { Mail } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { ListPage } from "@/components/admin/list-page";
import { DataToolbar, ToolbarSegment } from "@/components/admin/data-toolbar";
import { StatusPill } from "@/components/admin/status-badge";
import { UnsubscribeButton } from "@/components/admin/unsubscribe-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSubscribers } from "@/lib/cms/subscribers";

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const subscribers = await listSubscribers();
  const filter = status === "active" || status === "unsubscribed" ? status : "all";
  const rows =
    filter === "all" ? subscribers : subscribers.filter((item) => item.status === filter);

  return (
    <ListPage
      title="Subscribers"
      subtitle="People who asked to hear when a new blog post goes live."
      toolbar={
        <DataToolbar
          segments={
            <>
              {(["all", "active", "unsubscribed"] as const).map((value) => (
                <ToolbarSegment
                  key={value}
                  href={value === "all" ? "/admin/subscribers" : `/admin/subscribers?status=${value}`}
                  active={filter === value}
                >
                  {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
                </ToolbarSegment>
              ))}
            </>
          }
        >
          <span className="text-xs text-muted-foreground tabular-nums">
            {rows.length} {rows.length === 1 ? "person" : "people"}
          </span>
        </DataToolbar>
      }
      table={
        rows.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="No subscribers yet"
            description="The blog subscribe card writes to this list."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>
                    <StatusPill status={subscriber.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {new Date(subscriber.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <UnsubscribeButton
                      id={subscriber.id}
                      email={subscriber.email}
                      disabled={subscriber.status !== "active"}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      }
    />
  );
}
