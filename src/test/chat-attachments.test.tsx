import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatAttachments, splitMessageMedia, splitUserBody } from "@/components/app/ChatAttachments";

const IMAGE = "https://cdn.example.com/generated-portrait.jpg";
const VIDEO = "https://cdn.example.com/generated-video.mp4";

describe("chat media", () => {
  it("extracts employee images and future generated videos without removing sources", () => {
    const parsed = splitMessageMedia(
      `النتيجة جاهزة\n\n![تصميم مولّد](${IMAGE})\n[المصدر](https://example.com)\n\n🎬 [فيديو مولّد](${VIDEO})`,
    );

    expect(parsed.items).toEqual([
      { url: IMAGE, type: "image", alt: "تصميم مولّد" },
      { url: VIDEO, type: "video", alt: "فيديو مولّد" },
    ]);
    expect(parsed.text).toContain("النتيجة جاهزة");
    expect(parsed.text).toContain("[المصدر](https://example.com)");
  });

  it("keeps uploaded user media compatible with the shared viewer", () => {
    const parsed = splitUserBody(`راجع هذه الصورة\n\n![صورة مرفقة](${IMAGE})`);
    expect(parsed.text).toBe("راجع هذه الصورة");
    expect(parsed.items[0]?.type).toBe("image");
  });

  it("renders a bounded chat image and opens then closes the full viewer", () => {
    render(<ChatAttachments items={[{ url: IMAGE, type: "image", alt: "صورة اختبار" }]} />);

    const trigger = screen.getByRole("button", { name: "عرض الصورة بحجم كامل" });
    expect(trigger.parentElement?.className).toContain("max-w-[min(20rem,78vw)]");
    expect(screen.getByAltText("صورة اختبار").className).toContain("max-h-[22rem]");

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إغلاق" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إغلاق" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses a stable two-column gallery for mixed image and video", () => {
    const { container } = render(
      <ChatAttachments items={[{ url: IMAGE, type: "image" }, { url: VIDEO, type: "video" }]} />,
    );
    expect(container.querySelector(".grid")?.className).toContain("grid-cols-2");
    expect(screen.getByRole("button", { name: "تشغيل الفيديو بحجم كامل" })).toBeInTheDocument();
  });
});