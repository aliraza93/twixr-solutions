import Link from "next/link";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Studio dashboard"
        description={
          configured
            ? "Inquiries, publishing, and site content in one place."
            : "Set PRISMA_DATABASE_URL (or DATABASE_URL / POSTGRES_URL) to persist inquiries and edit live content. File-based copy still powers the public site."
        }
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/blog/new">New post</Link>
          </Button>
        }
      />

      {!configured ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-ink">
          Missing a database URL. Pull{" "}
          <code className="font-mono">PRISMA_DATABASE_URL</code> from Vercel
          (production), then run{" "}
          <code className="font-mono">npm run db:push</code> and{" "}
          <code className="font-mono">npm run seed:cms</code>.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          index={0}
          label="Unread inquiries"
          value={inquiryCounts.unread}
          hint={`${inquiryCounts.total} total`}
          icon="inbox"
          tone="lime"
        />
        <KpiCard
          index={1}
          label="Published posts"
          value={published}
          hint={`${drafts} draft${drafts === 1 ? "" : "s"}`}
          icon="posts"
        />
        <KpiCard
          index={2}
          label="Services"
          value={services.length}
          icon="services"
        />
        <KpiCard
          index={3}
          label="Portfolio"
          value={portfolio.length}
          icon="portfolio"
        />
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-sora text-xl font-bold text-ink">Recent inquiries</h2>
          <Button asChild variant="text">
            <Link href="/admin/inquiries">Open inbox</Link>
          </Button>
        </div>
        {recent.length === 0 ? (
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
      </section>
    </div>
  );
}
