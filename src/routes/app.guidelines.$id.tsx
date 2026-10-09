import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { EmployeeGuidelines } from "@/components/app/EmployeeGuidelines";
import { EmployeeTopbar } from "@/components/app/EmployeeTopbar";
import { getMember } from "@/data/team";
import { useWorkspace } from "@/lib/data";

export const Route = createFileRoute("/app/guidelines/$id")({
  loader: ({ params }) => {
    const member = getMember(params.id);
    if (!member) throw notFound();
    return { name: member.name, role: member.role };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `تعليمات ${loaderData.name} | زياد` : "تعليمات الموظف | زياد" },
      { name: "description", content: loaderData ? `خصّص تعليمات ${loaderData.name} وتفضيلاته لكل مهمة.` : "خصّص تعليمات موظفك الرقمي لكل مهمة." },
      { property: "og:title", content: loaderData ? `تعليمات ${loaderData.name} | زياد` : "تعليمات الموظف | زياد" },
      { property: "og:description", content: loaderData ? `خصّص تعليمات ${loaderData.name} وتفضيلاته لكل مهمة.` : "خصّص تعليمات موظفك الرقمي لكل مهمة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmployeeGuidelinesPage,
});

function EmployeeGuidelinesPage() {
  const { id } = Route.useParams();
  const member = getMember(id);
  const { data: workspace } = useWorkspace();
  if (!member) return null;

  return (
    <AppShell title={`تعليمات ${member.name}`} lead={`التفضيلات المتخصصة التي يطبقها ${member.name} تلقائياً في كل طلب مناسب.`} hideTitle compactTitle actions={<EmployeeTopbar memberId={member.id} active="guidelines" />}>
      <main className="mx-auto w-full max-w-3xl" dir="rtl">
        <section className="border-t border-border pt-5">
          <EmployeeGuidelines {...(workspace?.id ? { workspaceId: workspace.id } : {})} employeeId={member.id} employeeName={member.name} />
        </section>
      </main>
    </AppShell>
  );
}