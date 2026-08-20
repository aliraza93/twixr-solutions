import Link from "next/link";
import { PanelsTopLeft } from "lucide-react";
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
import { listServicesAdmin } from "@/lib/cms/services";
import { RowActions } from "@/components/admin/row-actions";
import { deleteServiceAction } from "@/app/admin/actions";

export default async function AdminServicesPage() {
  const services = await listServicesAdmin();

  return (
    <ListPage
      title="Services"
      subtitle="Powers /services and service detail pages. Homepage cards follow this catalog."
      actions={
        <Button asChild>
          <Link href="/admin/services/new">Add service</Link>
        </Button>
      }
      toolbar={
        <DataToolbar>
          <span className="text-xs text-muted-foreground tabular-nums">
            {services.length} {services.length === 1 ? "service" : "services"}
          </span>
        </DataToolbar>
      }
      table={
        services.length === 0 ? (
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
                    <Link
                      href={`/admin/services/${service.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {service.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{service.categoryLabel}</TableCell>
                  <TableCell className="text-muted-foreground">{service.slug}</TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      editHref={`/admin/services/${service.id}`}
                      viewHref={`/services/${service.slug}`}
                      deleteConfig={{
                        id: service.id,
                        confirmMessage: `Delete “${service.title}”?`,
                        action: deleteServiceAction,
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
