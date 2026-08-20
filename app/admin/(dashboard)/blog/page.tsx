import Link from "next/link";
import { BookOpen } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusPill } from "@/components/admin/status-pill";
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
import { listBlogPostsAdmin } from "@/lib/cms/blog";
import { RowActions } from "@/components/admin/row-actions";
import { deleteBlogPostAction } from "@/app/admin/actions";

export default async function AdminBlogPage() {
  const posts = await listBlogPostsAdmin();
  const published = posts.filter((post) => post.published).length;

  return (
    <ListPage
      title="Blog"
      subtitle="Draft and publish posts. The public site only shows published entries."
      actions={
        <Button asChild>
          <Link href="/admin/blog/new">New post</Link>
        </Button>
      }
      toolbar={
        <DataToolbar>
          <span className="text-xs text-muted-foreground tabular-nums">
            {published} published · {posts.length - published} draft
            {posts.length - published === 1 ? "" : "s"}
          </span>
        </DataToolbar>
      }
      table={
        posts.length === 0 ? (
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
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{post.slug}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.category}</TableCell>
                  <TableCell>
                    <StatusPill status={post.published ? "published" : "draft"} />
                  </TableCell>
                  <TableCell className="tabular-nums">{post.order}</TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      editHref={`/admin/blog/${post.id}`}
                      viewHref={post.published ? `/blog/${post.slug}` : undefined}
                      deleteConfig={{
                        id: post.id,
                        confirmMessage: `Delete “${post.title}”?`,
                        action: deleteBlogPostAction,
                      }}
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
