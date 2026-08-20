import Link from "next/link";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
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
import { ConfirmButton } from "@/components/admin/confirm-dialog";
import { deleteBlogPostAction } from "@/app/admin/actions";

export default async function AdminBlogPage() {
  const posts = await listBlogPostsAdmin();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Publishing"
        title="Blog"
        description="Draft and publish posts. The public site only shows published entries."
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/blog/new">New post</Link>
          </Button>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No posts yet"
          description="Write your first article for the insights section."
          action={{ href: "/admin/blog/new", label: "New post" }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Link
                    href={`/admin/blog/${post.id}`}
                    className="font-medium text-ink hover:text-pine"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-muted">/{post.slug}</p>
                </TableCell>
                <TableCell>{post.category}</TableCell>
                <TableCell>
                  <StatusPill status={post.published ? "published" : "draft"} />
                </TableCell>
                <TableCell>{post.order}</TableCell>
                <TableCell className="text-right">
                  <ConfirmButton
                    label="Delete"
                    confirmMessage={`Delete “${post.title}”?`}
                    action={deleteBlogPostAction}
                    id={post.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
