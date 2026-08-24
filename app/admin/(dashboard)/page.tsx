import Link from "next/link";
import { Inbox } from "lucide-react";
import { PageContainer } from "@/components/admin/page-container";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
import { DataTableCard } from "@/components/admin/data-table-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listBlogPostsAdmin } from "@/lib/cms/blog";
import { countInquiriesByStatus, listInquiries } from "@/lib/cms/inquiries";
import { listPortfolioAdmin } from "@/lib/cms/portfolio";
import { listServicesAdmin } from "@/lib/cms/services";
import { isDatabaseConfigured } from "@/lib/cms/env";

export default async function AdminDashboard() {
  const configured = isDatabaseConfigured();
  const [inquiryCounts, inquiries, posts, services, portfolio] = await Promise.all([
    countInquiriesByStatus(),
    listInquiries(),
    listBlogPostsAdmin(),
    listServicesAdmin(),
    listPortfolioAdmin(),
  ]);

  const recent = inquiries.slice(0, 6);
  const published = posts.filter((post) => post.published).length;
  const drafts = posts.length - published;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle={
          configured
            ? "Inquiries, publishing, and site content in one place."
            : "Set PRISMA_DATABASE_URL to persist inquiries and edit live content. File-based copy still powers the public site."
        }
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">New post</Link>
          </Button>
        }
      />

      {!configured ? (
        <div className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-foreground">
          Missing a database URL. Pull{" "}
          <code className="font-mono text-xs">PRISMA_DATABASE_URL</code> from Vercel
          (production), then run{" "}
          <code className="font-mono text-xs">npm run db:push</code> and{" "}
          <code className="font-mono text-xs">npm run seed:cms</code>.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Unread inquiries"
          value={inquiryCounts.unread}
          hint={`${inquiryCounts.total} total`}
          icon="inbox"
        />
        <KpiCard
          label="Published posts"
          value={published}
          hint={`${drafts} draft${drafts === 1 ? "" : "s"}`}
          icon="posts"
        />
        <KpiCard label="Services" value={services.length} icon="services" />
        <KpiCard label="Portfolio" value={portfolio.length} icon="portfolio" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Recent inquiries</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/inquiries">Open inbox</Link>
          </Button>
        </div>
        <DataTableCard
          table={
            recent.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No inquiries yet"
                description="Contact form submissions will land here after email delivery."
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
                  {recent.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell>
                        <Link
                          href={`/admin/inquiries?id=${inquiry.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {inquiry.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{inquiry.email}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inquiry.projectType || " - "}
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
            )
          }
        />
      </section>
    </PageContainer>
  );
}
