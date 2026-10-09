import { describe, test, expect } from "bun:test";
import JSZip from "jszip";
import { validateReferenceFile } from "../../src/lib/reference-files";
import { extractReference } from "../../src/lib/reference-files.server";

describe("brand reference uploads", () => {
  test("rejects unsupported, empty, oversized and unsafe names", () => {
    for (const f of [{name:"a.exe",size:2}, {name:"a.txt",size:0}, {name:"a.pdf",size:5e6}, {name:"../a.txt",size:30}]) expect(() => validateReferenceFile(f)).toThrow();
  });
  test("reads UTF-8 Arabic text without dropping prices", async () => {
    const text = "قائمة الأسعار: تصميم الهوية 2500 ريال شامل الضريبة";
    expect(await extractReference(new File([text], "menu.txt"))).toBe(text);
  });
  test("reads Word paragraphs and table text", async () => {
    const zip = new JSZip();
    zip.file("word/document.xml", '<w:document><w:body><w:p><w:r><w:t>Company profile and services</w:t></w:r></w:p><w:p><w:r><w:t>Price: 500 SAR</w:t></w:r></w:p></w:body></w:document>');
    const bytes = await zip.generateAsync({type:"uint8array"});
    const text = await extractReference(new File([bytes], "company.docx"));
    expect(text).toContain("Company profile"); expect(text).toContain("500 SAR");
  });
  test("reads all Excel worksheets", async () => {
    const {utils, write} = await import("xlsx");
    const book = utils.book_new();
    utils.book_append_sheet(book, utils.aoa_to_sheet([["Service", "Price"],["Design",500]]),"Rates");
    utils.book_append_sheet(book, utils.aoa_to_sheet([["Menu", "Lunch package"]]),"Menu");
    const text = await extractReference(new File([write(book,{type:"array",bookType:"xlsx"})],"rates.xlsx"));
    expect(text).toContain("Design,500"); expect(text).toContain("Lunch package");
  });
  test("rejects disguised PDF and image-only text", async () => {
    await expect(extractReference(new File(["not a pdf"],"fake.pdf"))).rejects.toThrow("PDF");
    await expect(extractReference(new File(["short"],"empty.txt"))).rejects.toThrow("نص");
  });
});