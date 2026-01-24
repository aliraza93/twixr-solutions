import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, FileText, Briefcase, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  // Fetch stats (mock or real if DB connected)
  const projectCount = await prisma.project.count().catch(() => 0);
  const testimonialCount = await prisma.testimonial.count().catch(() => 0);
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
        <div className="flex gap-2">
            <Button asChild>
                <Link href="/admin/projects/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Project
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">+0 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testimonials</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonialCount}</div>
            <p className="text-xs text-muted-foreground">+0 from last month</p>
          </CardContent>
        </Card>
         {/* Add more cards for inquiries etc */}
      </div>
      
      {/* Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader><CardTitle>Recent Projects</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">No projects found. Start by adding one!</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
