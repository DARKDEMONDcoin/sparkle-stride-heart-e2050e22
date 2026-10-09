import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AccountMenu } from "@/components/app/AccountMenu";

vi.mock("@tanstack/react-router", () => ({ Link: ({ to, search, children, ...props }: any) => <a href={`${to}${search?.tab ? `?tab=${search.tab}` : ""}`} {...props}>{children}</a> }));

describe("account menu", () => {
  it("keeps account destinations without repeated navigation or uniform controls", () => {
    const onSignOut = vi.fn();
    render(<AccountMenu open onOpenChange={vi.fn()} avatar={<span>صورة</span>} name="أحمد علي" email="ahmed@example.com" onPhoto={vi.fn()} onSignOut={onSignOut} busy={false} error={null} />);
    expect(screen.getByRole("link", { name: "الملف الشخصي" })).toHaveAttribute("href", "/app/settings?tab=account");
    expect(screen.getByRole("link", { name: "الإعدادات" })).toHaveAttribute("href", "/app/settings?tab=workspace");
    expect(screen.getAllByRole("link")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "المساعدة والدعم" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تسجيل الخروج" }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});