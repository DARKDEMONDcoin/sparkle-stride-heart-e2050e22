import JSZip from "jszip";
import { parseHTML } from "linkedom";
import { validateReferenceFile } from "./reference-files";

export async function extractReference(file: File): Promise<string> {
  validateReferenceFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  if (ext === "pdf") {
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("محتوى الملف ليس PDF صالحًا.");
    const { getDocumentProxy, extractText } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    try {
      if (pdf.numPages > 100) throw new Error("قسّم ملف PDF إلى ملفات لا تتجاوز 100 صفحة.");
      text = (await extractText(pdf, { mergePages: true })).text;
    } finally { await pdf.cleanup(); }
  } else if (ext === "docx" || ext === "xlsx") {
    const zip = await JSZip.loadAsync(bytes);
    let expanded = 0;
    for (const entry of Object.values(zip.files)) {
      expanded += (entry as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0;
    }
    if (expanded > 20 * 1024 * 1024 || Object.keys(zip.files).length > 2000) throw new Error("الملف كبير بعد فك ضغطه؛ قسّمه إلى مستندات أصغر.");
    if (ext === "docx") {
      const part = zip.file("word/document.xml");
      if (!part) throw new Error("ملف Word غير صالح.");
      const xml = (await part.async("string")).replace(/<\/w:p>/g, "\n").replace(/<\/w:tc>/g, "\t");
      text = parseHTML(`<html><body>${xml}</body></html>`).document.body.textContent ?? "";
    } else text = await spreadsheetText(bytes);
  } else if (ext === "xls" || ext === "csv") text = await spreadsheetText(bytes);
  else text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  text = text.replace(/\u0000/g, "").trim();
  if (text.length < 20) throw new Error("لم نجد نصًا قابلًا للقراءة. للملفات الممسوحة ضوئيًا، ارفع نسخة نصية أو الصق النص.");
  if (text.length > 100_000) throw new Error("المستند يتجاوز 100 ألف حرف؛ قسّمه لتُحفظ معلوماته كاملة.");
  return text;
}

async function spreadsheetText(bytes: Uint8Array) {
  const { read, utils } = await import("xlsx");
  const book = read(bytes, { type: "array", cellFormula: false, cellHTML: false });
  if (book.SheetNames.length > 30) throw new Error("قسّم المصنف إلى ملفات لا تتجاوز 30 ورقة.");
  return book.SheetNames.map((name) => {
    const sheet = book.Sheets[name];
    return sheet ? `ورقة: ${name}\n${utils.sheet_to_csv(sheet)}` : "";
  }).join("\n\n");
}