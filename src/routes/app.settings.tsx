import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleGauge,
  CircleHelp,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { AppShell } from "@/components/app/AppShell";
import { AvatarUploader } from "@/components/app/AvatarUploader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { COUNTRIES } from "@/data/team-portraits";
import { useRegion } from "@/hooks/use-region";
import { supabase } from "@/integrations/supabase/client";
import {
  type NotificationPreferences,
  useNotificationPreferences,
  useProfile,
  useTasks,
  useUpdateNotificationPreferences,
  useUpdateProfile,
  useUpdateWorkspace,
  useWorkspace,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/settings")({
  validateSearch: (search: Record<string, unknown>): { tab?: TabId | undefined } => ({
    tab: typeof search["tab"] === "string" && isTab(search["tab"]) ? search["tab"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "الإعدادات | زياد" },
      {
        name: "description",
        content: "إدارة مساحة عمل زياد والحساب والأمان والتنبيهات والاستخدام.",
      },
      { property: "og:title", content: "الإعدادات | زياد" },
      {
        property: "og:description",
        content: "إدارة مساحة عمل زياد والحساب والأمان والتنبيهات والاستخدام.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

const tabs = [
  { id: "workspace", label: "مساحة العمل", hint: "الهوية والتفضيلات", icon: Building2 },
  { id: "account", label: "الملف الشخصي", hint: "بياناتك وأمان الحساب", icon: User },
  { id: "notifications", label: "التنبيهات", hint: "ما يصلك ومتى", icon: Bell },
  { id: "billing", label: "الاستخدام والباقات", hint: "حالة تجربتك", icon: CreditCard },
] as const;

type TabId = (typeof tabs)[number]["id"];

const field =
  "settings-input w-full border px-3.5 py-2.5 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

type NotificationDraft = Omit<NotificationPreferences, "user_id" | "created_at" | "updated_at">;

const defaultNotifications: NotificationDraft = {
  approval_ready: true,
  integration_disconnected: true,
  publishing_failed: true,
  weekly_summary: true,
  task_digest: true,
  digest_frequency: "weekly",
  timezone: "Africa/Cairo",
};

function isTab(value: string | null): value is TabId {
  return tabs.some((item) => item.id === value);
}

function SettingsPage() {
  const navigate = useNavigate();
  const requestedTab: unknown = useRouterState({ select: state => (state.location.search as Record<string, unknown>)["tab"] });
  const tab: TabId = typeof requestedTab === "string" && isTab(requestedTab) ? requestedTab : "workspace";
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: tasks, isLoading: tasksLoading } = useTasks(workspace?.id);

  const doneCount = (tasks ?? []).filter((task) => task.status === "done").length;
  const profileScore = useMemo(() => {
    if (!workspace || !profile) return 0;
    const values = [
      workspace.name,
      workspace.industry,
      workspace.tone,
      workspace.website,
      workspace.country,
      profile.full_name,
      profile.dialect,
    ];
    return Math.round((values.filter(Boolean).length / values.length) * 100);
  }, [workspace, profile]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function chooseTab(next: TabId) {
    setNotice(null);
    void navigate({ to: "/app/settings", search: { tab: next } });
  }

  const loading = workspaceLoading || profileLoading;

  return (
    <AppShell title="الإعدادات" lead="مساحة العمل والحساب">
      <div className="settings-studio">
      <header className="settings-heading">
        <div>
          <h2>{tab === "account" ? "الملف الشخصي" : "الإعدادات"}</h2>
          <p>{tab === "account" ? "بياناتك الشخصية وأمان حسابك" : "مساحة العمل، التفضيلات، والباقات"}</p>
        </div>
        <div className="settings-completion">
          <div><span>اكتمال مساحة العمل</span><span className="font-semibold text-primary">{profileScore}٪</span></div>
          <Progress value={profileScore} aria-label={`اكتمال مساحة العمل ${profileScore}٪`} />
        </div>
      </header>

      {notice ? (
        <div
          role="status"
          className={cn(
            "settings-notice mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold",
            notice.type === "success"
              ? "border-primary/25 bg-primary/10 text-foreground"
              : "border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <Bell className="size-4" />
          )}
          {notice.text}
        </div>
      ) : null}

      <div className="settings-layout">
        <nav aria-label="أقسام الإعدادات" className="settings-nav">
          <p className="settings-nav-label">إدارة حسابك</p>
          {tabs.map(item => <Button key={item.id} type="button" variant="ghost"
            onClick={() => chooseTab(item.id)} aria-current={tab === item.id ? "page" : undefined}
            className={cn("settings-nav-button", tab === item.id && "is-active")}>
            <item.icon className="size-4 shrink-0" />
            <span className="min-w-0"><strong>{item.label}</strong><small>{item.hint}</small></span>
          </Button>)}
          <Link to="/app/help" className="settings-nav-help"><CircleHelp className="size-4" />المساعدة والدعم<ChevronLeft className="ms-auto size-3" /></Link>
        </nav>

        <div className="min-w-0" aria-label={tabs.find(item => item.id === tab)?.label}>
          {loading ? <SettingsLoading /> : null}
          {!loading && tab === "workspace" && workspace ? (
            <WorkspacePanel workspace={workspace} onNotice={setNotice} />
          ) : null}
          {!loading && tab === "account" && profile ? (
            <AccountPanel profile={profile} onNotice={setNotice} />
          ) : null}
          {tab === "notifications" ? <NotificationsPanel onNotice={setNotice} /> : null}
          {tab === "billing" ? <BillingPanel doneCount={doneCount} loading={tasksLoading} /> : null}
        </div>
      </div>
      </div>
    </AppShell>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <header className="settings-panel-heading">
      <span className="shrink-0">
        <Icon className="size-5" />
      </span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="settings-panel">
      {children}
    </section>
  );
}

function SettingsLoading() {
  return (
    <div className="rounded-lg border border-border bg-card p-7" aria-label="جارٍ تحميل الإعدادات">
      <div className="mb-7 h-12 w-48 animate-pulse rounded-lg bg-secondary" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-lg bg-secondary/70" />
        ))}
      </div>
    </div>
  );
}

type WorkspaceData = NonNullable<ReturnType<typeof useWorkspace>["data"]>;
type ProfileData = NonNullable<ReturnType<typeof useProfile>["data"]>;
type NoticeSetter = (notice: { type: "success" | "error"; text: string }) => void;

function WorkspacePanel({
  workspace,
  onNotice,
}: {
  workspace: WorkspaceData;
  onNotice: NoticeSetter;
}) {
  const updateWorkspace = useUpdateWorkspace();

  return (
    <SettingsCard>
      <PanelHeader
        icon={Building2}
        title="مساحة العمل"
        description="هذه التفاصيل توجه الفريق عند إنشاء أي محتوى أو مهمة."
      />
      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const name = String(form.get("name") ?? "").trim();
          if (name.length < 2) {
            onNotice({ type: "error", text: "اسم النشاط يجب أن يتكوّن من حرفين على الأقل." });
            return;
          }
          try {
            await updateWorkspace.mutateAsync({
              id: workspace.id,
              patch: {
                name,
                initials:
                  String(form.get("initials") ?? "")
                    .trim()
                    .slice(0, 3) || name.slice(0, 2),
                industry: String(form.get("industry") ?? "").trim(),
                website: String(form.get("website") ?? "").trim() || null,
                country: String(form.get("country") ?? "").trim() || null,
                tone: String(form.get("tone") ?? "").trim(),
                banned_words: String(form.get("banned") ?? "")
                  .split(/[،,\n]/)
                  .map((word) => word.trim())
                  .filter(Boolean),
              },
            });
            onNotice({ type: "success", text: "تم حفظ إعدادات مساحة العمل." });
          } catch {
            onNotice({ type: "error", text: "تعذّر حفظ مساحة العمل. أعد المحاولة." });
          }
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="اسم النشاط" required>
            <input name="name" required defaultValue={workspace.name} className={field} />
          </Field>
          <Field label="الأحرف المختصرة" hint="تظهر في صورة مساحة العمل">
            <input
              name="initials"
              maxLength={3}
              defaultValue={workspace.initials}
              className={field}
            />
          </Field>
          <Field label="المجال">
            <input name="industry" defaultValue={workspace.industry} className={field} />
          </Field>
          <Field label="الدولة">
            <select name="country" defaultValue={workspace.country ?? ""} className={field}>
              <option value="">اختر الدولة</option>
              {COUNTRIES.map((item) => (
                <option key={item.code} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الموقع الإلكتروني" hint="اختياري">
            <div className="relative">
              <Globe2 className="absolute right-3 top-3 size-4 text-muted-foreground" />
              <input
                name="website"
                type="url"
                dir="ltr"
                defaultValue={workspace.website ?? ""}
                placeholder="https://example.com"
                className={cn(field, "pe-9")}
              />
            </div>
          </Field>
        </div>
        <Field label="نبرة العلامة" hint="صف كيف تريد أن يبدو صوت علامتك">
          <textarea
            name="tone"
            defaultValue={workspace.tone}
            className={cn(field, "min-h-28 resize-y")}
          />
        </Field>
        <Field label="الكلمات الممنوعة" hint="افصل بينها بفاصلة عربية أو اكتب كل كلمة في سطر">
          <textarea
            name="banned"
            defaultValue={workspace.banned_words.join("، ")}
            className={cn(field, "min-h-24 resize-y")}
          />
        </Field>
        <Button type="submit" disabled={updateWorkspace.isPending} className="gap-2">
          {updateWorkspace.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {updateWorkspace.isPending ? "جارٍ الحفظ" : "حفظ التغييرات"}
        </Button>
      </form>
    </SettingsCard>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="settings-field">
      <span className="mb-2 flex items-center gap-1 text-sm font-extrabold">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function AccountPanel({ profile, onNotice }: { profile: ProfileData; onNotice: NoticeSetter }) {
  const { country, setCountry } = useRegion();
  const updateProfile = useUpdateProfile();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "حساب تجريبي");
      setUserId(data.user?.id ?? null);
      setAnonymous(Boolean(data.user?.is_anonymous));
    });
  }, []);

  return (
    <div className="space-y-5">
      <SettingsCard>
        <PanelHeader
          icon={User}
          title="بيانات الحساب"
          description="بياناتك الشخصية واللغة التي يكتب بها فريقك."
        />
        {userId ? (
          <div className="settings-avatar-editor">
             <div><h3>{profile.full_name || "صورتك الشخصية"}</h3><p className="settings-avatar-caption">الصورة الشخصية</p></div>
            <AvatarUploader
              userId={userId}
              path={profile.avatar_url}
              name={profile.full_name ?? ""}
              onError={(text) => onNotice({ type: "error", text })}
              onChange={async (nextPath) => {
                try {
                  await updateProfile.mutateAsync({
                    id: profile.id,
                    patch: { avatar_url: nextPath },
                  });
                  onNotice({
                    type: "success",
                    text: nextPath ? "تم تحديث صورتك الشخصية." : "تم حذف صورتك الشخصية.",
                  });
                } catch {
                  onNotice({ type: "error", text: "تعذّر حفظ الصورة." });
                }
              }}
            />
          </div>
        ) : null}
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            try {
              await updateProfile.mutateAsync({
                id: profile.id,
                patch: {
                  full_name: String(form.get("full_name") ?? "").trim(),
                  dialect: String(form.get("dialect") ?? ""),
                  job_title: String(form.get("job_title") ?? "").trim() || null,
                  phone: String(form.get("phone") ?? "").trim() || null,
                },
              });
              onNotice({ type: "success", text: "تم تحديث بيانات حسابك." });
            } catch {
              onNotice({ type: "error", text: "تعذّر تحديث الحساب." });
            }
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="الاسم">
              <input name="full_name" defaultValue={profile.full_name ?? ""} className={field} />
            </Field>
            <Field label="البريد الإلكتروني">
              <div className="relative">
                <Mail className="absolute right-3 top-3 size-4 text-muted-foreground" />
                <input value={email} readOnly className={cn(field, "pe-9 text-muted-foreground")} />
              </div>
            </Field>
            <Field label="المسمى الوظيفي" hint="اختياري — يظهر في التقارير التي يعدّها فريقك">
              <input
                name="job_title"
                defaultValue={profile.job_title ?? ""}
                placeholder="مدير التسويق"
                className={field}
              />
            </Field>
            <Field label="رقم الجوال" hint="اختياري — لتنبيهات واتساب مستقبلاً">
              <input
                name="phone"
                type="tel"
                dir="ltr"
                defaultValue={profile.phone ?? ""}
                placeholder="+9665…"
                className={field}
              />
            </Field>
            <Field label="لهجة المحتوى">
              <select name="dialect" defaultValue={profile.dialect} className={field}>
                {["خليجية", "مصرية", "شامية", "مغاربية", "فصحى معاصرة"].map((dialect) => (
                  <option key={dialect}>{dialect}</option>
                ))}
              </select>
            </Field>
            <Field label="زيّ الفريق في الصور" hint="يغيّر مظهر الموظفين في الصور التي ينشئها زياد">
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className={field}
              >
                {COUNTRIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button type="submit" disabled={updateProfile.isPending} className="gap-2">
            <Save className="size-4" />
            حفظ الحساب
          </Button>
        </form>
      </SettingsCard>

      <SettingsCard>
        <PanelHeader
          icon={LockKeyhole}
          title="الأمان"
          description="استخدم كلمة مرور قوية ومختلفة عن حساباتك الأخرى."
        />
        {anonymous ? (
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-sm">
            أنت تستخدم التجربة حالياً.{" "}
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="font-bold text-primary underline"
            >
              أنشئ حساباً دائماً
            </Link>{" "}
            لإدارة كلمة المرور.
          </div>
        ) : (
          <form
            className="max-w-xl space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const password = String(form.get("password") ?? "");
              const confirm = String(form.get("confirm") ?? "");
              if (password.length < 8)
                return onNotice({
                  type: "error",
                  text: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل.",
                });
              if (password !== confirm)
                return onNotice({ type: "error", text: "كلمتا المرور غير متطابقتين." });
              setPasswordBusy(true);
              const { error } = await supabase.auth.updateUser({ password });
              setPasswordBusy(false);
              if (error) onNotice({ type: "error", text: "تعذّر تغيير كلمة المرور." });
              else {
                event.currentTarget.reset();
                onNotice({ type: "success", text: "تم تغيير كلمة المرور بنجاح." });
              }
            }}
          >
            <Field label="كلمة المرور الجديدة">
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={cn(field, "ps-10")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute left-1 top-1 size-8"
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </Field>
            <Field label="تأكيد كلمة المرور">
              <input
                name="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className={field}
              />
            </Field>
            <Button type="submit" disabled={passwordBusy} className="gap-2">
              {passwordBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              تغيير كلمة المرور
            </Button>
          </form>
        )}
        <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
          <p className="w-full text-xs leading-5 text-muted-foreground">يشمل الملف بيانات ملفك الشخصي ومساحات العمل التي تملكها، ولا يشمل المحادثات أو ملفات الخدمات المرتبطة.</p>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={async () => {
              const [{ data: workspaces }, { data: profiles }] = await Promise.all([
                supabase.from("workspaces").select("*"),
                supabase.from("profiles").select("*"),
              ]);
              const blob = new Blob([JSON.stringify({ profiles, workspaces }, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = "sahl-account-data.json";
              anchor.click();
              URL.revokeObjectURL(url);
              onNotice({ type: "success", text: "تم تنزيل ملف بيانات الحساب ومساحات العمل." });
            }}
          >
            <Download className="size-4" />
            تنزيل نسخة من بياناتي
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await supabase.auth.signOut({ scope: "global" });
              window.location.assign("/");
            }}
          >
            <ShieldCheck className="size-4" />
            تسجيل الخروج من كل الأجهزة
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.assign("/");
            }}
          >
            <LogOut className="size-4" />
            تسجيل الخروج من هذا الجهاز
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}

function NotificationsPanel({ onNotice }: { onNotice: NoticeSetter }) {
  const { data, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();
  const [preferences, setPreferences] = useState(defaultNotifications);

  useEffect(() => {
    if (!data) return;
    setPreferences({
      approval_ready: data.approval_ready,
      integration_disconnected: data.integration_disconnected,
      publishing_failed: data.publishing_failed,
      weekly_summary: data.weekly_summary,
      task_digest: data.task_digest,
      digest_frequency: data.digest_frequency,
      timezone: data.timezone,
    });
  }, [data]);

  const options = [
    {
      key: "approval_ready",
      title: "جاهزية عنصر للموافقة",
      description: "عندما ينتظر منشور أو تصميم قرارك.",
    },
    {
      key: "publishing_failed",
      title: "فشل النشر",
      description: "تنبيه فوري عند تعذّر نشر محتوى مجدول.",
    },
    {
      key: "integration_disconnected",
      title: "انقطاع اتصال",
      description: "عندما يحتاج حساب مرتبط إلى إعادة تسجيل الدخول.",
    },
    {
      key: "task_digest",
      title: "ملخص المهام",
      description: "ملخص بالمهام التي أتمها الفريق وما ينتظر قرارك.",
    },
    {
      key: "weekly_summary",
      title: "التقرير الأسبوعي",
      description: "نظرة موجزة على أداء الفريق كل أسبوع.",
    },
  ] as const;

  if (isLoading) return <SettingsLoading />;

  return (
    <SettingsCard>
      <PanelHeader
        icon={Bell}
        title="التنبيهات"
        description="اختر الأحداث المهمة فقط، ويمكنك تعديلها في أي وقت."
      />
      <div>
        {options.map((option) => (
          <div
            key={option.key}
            className="settings-notification-row"
          >
            <div>
              <p className="text-sm font-extrabold">{option.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
            </div>
            <Switch
              checked={preferences[option.key]}
              onCheckedChange={(checked) =>
                setPreferences((current) => ({ ...current, [option.key]: checked }))
              }
              aria-label={option.title}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
        <Field label="وتيرة الملخص">
          <select
            value={preferences.digest_frequency}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, digest_frequency: event.target.value }))
            }
            className={field}
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
          </select>
        </Field>
        <Field label="المنطقة الزمنية">
          <select
            value={preferences.timezone}
            onChange={(event) =>
              setPreferences((current) => ({ ...current, timezone: event.target.value }))
            }
            className={field}
          >
            <option value="Asia/Riyadh">الرياض</option>
            <option value="Africa/Cairo">القاهرة</option>
            <option value="Asia/Dubai">دبي</option>
            <option value="Africa/Casablanca">الدار البيضاء</option>
          </select>
        </Field>
      </div>
      <Button
        type="button"
        className="mt-6 gap-2"
        disabled={update.isPending}
        onClick={async () => {
          try {
            await update.mutateAsync(preferences);
            onNotice({ type: "success", text: "تم حفظ تفضيلات التنبيهات." });
          } catch {
            onNotice({ type: "error", text: "تعذّر حفظ تفضيلات التنبيهات." });
          }
        }}
      >
        {update.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        حفظ التنبيهات
      </Button>
    </SettingsCard>
  );
}

function BillingPanel({ doneCount, loading }: { doneCount: number; loading: boolean }) {
  const limit = 50;
  const usage = Math.min(100, (doneCount / limit) * 100);
  return (
    <SettingsCard>
      <PanelHeader
        icon={CircleGauge}
        title="الاستخدام والباقات"
        description="أرقام حقيقية من مهام مساحة العمل الحالية."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-5">
          <p className="text-xs font-bold text-primary">الخطة الحالية</p>
          <p className="mt-2 text-xl font-black">التجربة المجانية</p>
          <p className="mt-2 text-sm text-muted-foreground">
            ابدأ بدون بطاقة دفع، ثم اختر الباقة المناسبة عند الحاجة.
          </p>
        </div>
        <div className="rounded-lg border border-border p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold">المهام المكتملة</p>
            <Sparkles className="size-5 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-black">
            {loading ? "—" : doneCount}
            <span className="text-base font-semibold text-muted-foreground"> / {limit}</span>
          </p>
          <Progress value={usage} className="mt-4" />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border p-4">
        <div>
          <p className="text-sm font-extrabold">هل تحتاج سعة أكبر؟</p>
          <p className="mt-1 text-xs text-muted-foreground">
            قارن الحدود والمزايا قبل اختيار خطتك.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/pricing">
            عرض الباقات
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        لا توجد وسيلة دفع مرتبطة بهذه المساحة حالياً.
      </p>
    </SettingsCard>
  );
}
