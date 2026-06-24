import { Card } from '@/components/Card';
import { DataRow } from '@/components/DataRow';
import { MetricCard } from '@/components/MetricCard';
import { PageHeader } from '@/components/PageHeader';
import { DashboardGrid } from '@/components/layout-grid';
import { projects } from '@/data/mock';

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Projects / Revenue" title="Project execution and revenue signals" />
      <DashboardGrid>
        <Card title="Active projects" className="md:col-span-8">
          {projects.map((project) => (
            <DataRow
              key={project.name}
              label={project.name}
              value={project.revenue}
              hint={`${project.status} • Next: ${project.next}`}
            />
          ))}
        </Card>
        <MetricCard
          title="Revenue events"
          value="$12.4k"
          description="Mock month-to-date revenue before Stripe/accounting integrations."
          className="md:col-span-4"
        />
      </DashboardGrid>
    </div>
  );
}
