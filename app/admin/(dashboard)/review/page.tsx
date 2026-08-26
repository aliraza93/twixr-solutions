import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import {
  approveBlog,
  approveSocial,
  discardBlog,
  discardSocial,
} from "@/app/admin/review-actions";
import { EmptyState } from "@/components/admin/empty-state";
import { ListPage } from "@/components/admin/list-page";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/cms/auth";
import { requireDb, withDb } from "@/lib/cms/db";

function asReasons(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  return [];
}

export default async function AdminReviewPage() {
  await requireUser();

  const { blogs, socials } = await withDb(async () => {
    const db = requireDb();
    const [blogs, socials] = await Promise.all([
      db.blogPost.findMany({
        where: { reviewState: "needs_review" },
        orderBy: { updatedAt: "desc" },
      }),
      db.socialPost.findMany({
        where: { status: "needs_review" },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return { blogs, socials };
  }, { blogs: [], socials: [] });

  const total = blogs.length + socials.length;

  return (
    <ListPage
      title="Review"
      subtitle="Pipeline items that failed validators or the critic. Approve to publish, or discard."
      toolbar={
        <DataToolbar>
          <span className="text-xs text-muted-foreground tabular-nums">
            {blogs.length} blog · {socials.length} social
          </span>
        </DataToolbar>
      }
      table={
        total === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing to review"
            description="The pipeline queue is clear. Happy-path posts skip this screen."
          />
        ) : (
          <div className="space-y-10">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Blog posts
              </h2>
              {blogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blog items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Reasons</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogs.map((post) => {
                      const reasons = asReasons(post.reviewReasons);
                      return (
                        <TableRow key={post.id}>
                          <TableCell>
                            <Link
                              href={`/admin/blog/${post.id}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {post.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              /{post.slug}
                            </p>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {post.criticScore ?? "-"}
                          </TableCell>
                          <TableCell className="max-w-md text-sm text-muted-foreground">
                            {reasons.length ? reasons.join("; ") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <form action={approveBlog}>
                                <input type="hidden" name="id" value={post.id} />
                                <Button type="submit" size="sm">
                                  Approve
                                </Button>
                              </form>
                              <form action={discardBlog}>
                                <input type="hidden" name="id" value={post.id} />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                >
                                  Discard
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                LinkedIn posts
              </h2>
              {socials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No social items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Preview</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Reasons</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socials.map((post) => {
                      const reasons = asReasons(post.reviewReasons);
                      return (
                        <TableRow key={post.id}>
                          <TableCell className="max-w-sm">
                            <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                              {post.body}
                            </p>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {post.criticScore ?? "-"}
                          </TableCell>
                          <TableCell className="max-w-md text-sm text-muted-foreground">
                            {reasons.length ? reasons.join("; ") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <form action={approveSocial}>
                                <input type="hidden" name="id" value={post.id} />
                                <Button type="submit" size="sm">
                                  Approve
                                </Button>
                              </form>
                              <form action={discardSocial}>
                                <input type="hidden" name="id" value={post.id} />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                >
                                  Discard
                                </Button>
                              </form>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        )
      }
    />
  );
}
