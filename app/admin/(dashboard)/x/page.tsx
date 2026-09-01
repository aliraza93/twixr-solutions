import Image from "next/image";
import Link from "next/link";
import { AtSign } from "lucide-react";
import { discardXPost, markXPosted } from "@/app/admin/x-actions";
import { CopyTextButton } from "@/components/admin/copy-text-button";
import { EmptyState } from "@/components/admin/empty-state";
import { ListPage } from "@/components/admin/list-page";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { StatusPill } from "@/components/admin/status-pill";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/cms/auth";
import { requireDb, withDb } from "@/lib/cms/db";
import { xWeightedLength } from "@/lib/pipeline/generate-x";

export default async function AdminXPage() {
  await requireUser();

  const posts = await withDb(async () => {
    const db = requireDb();
    return db.socialPost.findMany({
      where: { channel: "x" },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        blogPost: { select: { id: true, title: true, slug: true } },
      },
    });
  }, []);

  const pending = posts.filter((p) => p.status === "manual");
  const done = posts.filter((p) => p.status !== "manual");

  return (
    <ListPage
      title="X posts"
      subtitle="Drafts generated for you to post manually on X. No X API calls - no API billing."
      toolbar={
        <DataToolbar>
          <span className="text-xs text-muted-foreground tabular-nums">
            {pending.length} ready · {done.length} archived
          </span>
        </DataToolbar>
      }
      table={
        posts.length === 0 ? (
          <EmptyState
            icon={AtSign}
            title="No X drafts yet"
            description="When the pipeline generates a blog, an X draft with image will appear here."
          />
        ) : (
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Ready to post
              </h2>
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Queue is empty. New drafts show up after the next generate run.
                </p>
              ) : (
                <div className="grid gap-6">
                  {pending.map((post) => (
                    <XCard key={post.id} post={post} pending />
                  ))}
                </div>
              )}
            </section>

            {done.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Posted / discarded
                </h2>
                <div className="grid gap-6">
                  {done.map((post) => (
                    <XCard key={post.id} post={post} pending={false} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )
      }
    />
  );
}

type XCardPost = {
  id: string;
  body: string;
  imageUrl: string;
  status: string;
  createdAt: Date;
  publishedAt: Date | null;
  failReason: string;
  blogPost: { id: string; title: string; slug: string } | null;
};

function XCard({
  post,
  pending,
}: {
  post: XCardPost;
  pending: boolean;
}) {
  const chars = xWeightedLength(post.body);

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="relative aspect-square bg-muted md:aspect-auto md:min-h-[220px]">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt="X post image"
              fill
              className="object-cover"
              sizes="220px"
              unoptimized
            />
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              status={
                post.status === "manual"
                  ? "ready"
                  : post.status === "published"
                    ? "posted"
                    : post.status === "failed"
                      ? "discarded"
                      : post.status
              }
            />
            <span className="text-xs text-muted-foreground tabular-nums">
              {chars}/280
            </span>
            <span className="text-xs text-muted-foreground">
              {post.createdAt.toISOString().slice(0, 10)}
            </span>
          </div>

          {post.blogPost ? (
            <p className="text-sm text-muted-foreground">
              Blog:{" "}
              <Link
                href={`/admin/blog/${post.blogPost.id}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {post.blogPost.title}
              </Link>
            </p>
          ) : null}

          <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-foreground">
            {post.body}
          </pre>

          {post.failReason ? (
            <p className="text-xs text-muted-foreground">{post.failReason}</p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2">
            <CopyTextButton text={post.body} />
            {post.imageUrl ? (
              <Button asChild size="sm" variant="outline">
                <a href={post.imageUrl} target="_blank" rel="noreferrer">
                  Open image
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <a
                href="https://x.com/compose/post"
                target="_blank"
                rel="noreferrer"
              >
                Open X compose
              </a>
            </Button>
            {pending ? (
              <>
                <form action={markXPosted}>
                  <input type="hidden" name="id" value={post.id} />
                  <Button type="submit" size="sm">
                    Mark posted
                  </Button>
                </form>
                <form action={discardXPost}>
                  <input type="hidden" name="id" value={post.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Discard
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
