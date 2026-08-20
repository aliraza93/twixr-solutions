import Link from "next/link";
import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
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
import { ConfirmButton } from "@/components/admin/confirm-dialog";
import { deletePortfolioAction } from "@/app/admin/actions";

export default async function AdminPortfolioPage() {
  const projects = await listPortfolioAdmin();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalog"
        title="Portfolio"
        description="Case studies for /portfolio. Featured items appear on the homepage."
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/portfolio/new">Add project</Link>
          </Button>
        }
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No projects"
          action={{ href: "/admin/portfolio/new", label: "Add project" }}
          description="Add a case study."
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
                  <Link href={`/admin/portfolio/${project.id}`} className="font-medium hover:text-pine">
                    {project.title}
                  </Link>
                </TableCell>
                <TableCell>{project.categoryLabel}</TableCell>
                <TableCell>{project.featured ? "Yes" : "No"}</TableCell>
                <TableCell className="text-right">
                  <ConfirmButton
                    label="Delete"
                    confirmMessage={`Delete “${project.title}”?`}
                    action={deletePortfolioAction}
                    id={project.id}
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
