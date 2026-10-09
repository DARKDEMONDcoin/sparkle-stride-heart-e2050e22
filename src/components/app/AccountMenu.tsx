import { ChevronLeft, Loader2, LogOut, Settings2, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ReactNode } from "react";

type Props = {
  open: boolean; onOpenChange: (open: boolean) => void; avatar: ReactNode;
  name: string | null; email: string | null; onPhoto: () => void;
  onSignOut: () => void; busy: boolean; error: string | null;
};

export function AccountMenu(props: Props) {
  const close = () => props.onOpenChange(false);
  return <Popover open={props.open} onOpenChange={props.onOpenChange}>
    <PopoverTrigger asChild>
      <Button type="button" variant="ghost" size="icon" aria-label="حسابك" className="app-user-avatar-trigger account-menu-trigger">{props.avatar}</Button>
    </PopoverTrigger>
    <PopoverContent dir="rtl" align="end" sideOffset={12} collisionPadding={12} className="account-menu" aria-label="قائمة الحساب">
      <div className="account-menu-identity">
        <Button type="button" variant="ghost" size="icon" onClick={props.onPhoto} aria-label="عرض الصورة الشخصية كاملة" className="account-menu-photo app-user-avatar-trigger">{props.avatar}</Button>
        <div className="min-w-0 flex-1">
          <span className="account-menu-eyebrow">حسابك في زياد</span>
          <p className="account-menu-name" dir="auto">{props.name || "حسابك"}</p>
          {props.email && <p className="account-menu-email" dir="ltr" title={props.email}>{props.email}</p>}
        </div>
      </div>
      <nav aria-label="روابط الحساب" className="account-menu-links">
        <Button asChild variant="ghost" className="account-menu-link account-menu-primary">
          <Link to="/app/settings" search={{ tab: "account" }} onClick={close}><span className="account-menu-icon"><User /></span><span>الملف الشخصي</span><ChevronLeft className="account-menu-arrow" /></Link>
        </Button>
        <Button asChild variant="ghost" className="account-menu-link">
          <Link to="/app/settings" search={{ tab: "workspace" }} onClick={close}><Settings2 /><span>الإعدادات</span><ChevronLeft className="account-menu-arrow" /></Link>
        </Button>
      </nav>
      <div className="account-menu-footer">
        {props.error && <p role="alert" className="mb-2 text-xs text-destructive">{props.error}</p>}
        <Button type="button" variant="ghost" disabled={props.busy} onClick={props.onSignOut} className="account-menu-logout">
          {props.busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />} {props.busy ? "جارٍ تسجيل الخروج" : "تسجيل الخروج"}
        </Button>
      </div>
    </PopoverContent>
  </Popover>;
}