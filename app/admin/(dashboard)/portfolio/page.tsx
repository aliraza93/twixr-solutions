import Link from "next/link";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { ListPage } from "@/components/admin/list-page";
import { DataToolbar } from "@/components/admin/data-toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listPortfolioAdmin } from "@/lib/cms/portfolio";
import { RowActions } from "@/components/admin/row-actions";
import { deletePortfolioAction } from "@/app/admin/actions";

export default async function AdminPortfolioPage() {
  const projects = await listPortfolioAdmin();

  return (
    <ListPage
      title="Portfolio"
      subtitle="Case studies for /portfolio. Featured items appear on the homepage."
      actions={
        <Button asChild>
          <Link href="/admin/portfolio/new">Add project</Link>
        </Button>
      }
      toolbar={
        <DataToolbar>
          <span className="text-xs text-muted-foreground tabular-nums">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </DataToolbar>
      }
      table={
        projects.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No projects"
            description="Add a case study."
            action={{ href: "/admin/portfolio/new", label: "Add project" }}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/admin/portfolio/${project.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {project.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.categoryLabel}</TableCell>
                  <TableCell>
                    <StatusBadge
                      status={project.featured ? "enabled" : "disabled"}
                      label={project.featured ? "Featured" : "Standard"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      editHref={`/admin/portfolio/${project.id}`}
                      viewHref={`/portfolio/${project.slug}`}
                      deleteConfig={{
                        id: project.id,
                        confirmMessage: `Delete “${project.title}”?`,
                        action: deletePortfolioAction,
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
