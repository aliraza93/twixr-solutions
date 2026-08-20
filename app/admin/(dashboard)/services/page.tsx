import Link from "next/link";
import { PanelsTopLeft } from "lucide-react";
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
import { listServicesAdmin } from "@/lib/cms/services";
import { ConfirmButton } from "@/components/admin/confirm-dialog";
import { deleteServiceAction } from "@/app/admin/actions";

export default async function AdminServicesPage() {
  const services = await listServicesAdmin();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalog"
        title="Services"
        description="Powers /services and service detail pages. Homepage cards follow this catalog."
        actions={
          <Button asChild variant="primary">
            <Link href="/admin/services/new">Add service</Link>
          </Button>
        }
      />
      {services.length === 0 ? (
        <EmptyState
          icon={PanelsTopLeft}
          title="No services"
          description="Add a service from the catalog."
          action={{ href: "/admin/services/new", label: "Add service" }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <Link href={`/admin/services/${service.id}`} className="font-medium hover:text-pine">
                    {service.title}
                  </Link>
                </TableCell>
                <TableCell>{service.categoryLabel}</TableCell>
                <TableCell className="text-muted">{service.slug}</TableCell>
                <TableCell className="text-right">
                  <ConfirmButton
                    label="Delete"
                    confirmMessage={`Delete “${service.title}”?`}
                    action={deleteServiceAction}
                    id={service.id}
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
