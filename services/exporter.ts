import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from "docx";
import JSZip from "jszip";
import { marked } from "marked";
import { GeneratedBook } from "../types";

// --- Native Save Helper ---
const saveFile = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

// --- DOCX Generation Logic ---

// Helper to parse simple markdown to Docx Paragraphs
const markdownToDocxParagraphs = (markdown: string): Paragraph[] => {
  const lines = markdown.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: "" })); // Empty line
      continue;
    }

    if (trimmed.startsWith('# ')) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace('# ', ''),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace('## ', ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
      }));
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(new Paragraph({
        text: trimmed.replace('### ', ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }));
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Support both - and * for lists, though we prefer -
      paragraphs.push(new Paragraph({
        text: trimmed.substring(2),
        bullet: { level: 0 }
      }));
    } else {
      // Basic Bold/Italic parsing
      // Split by bold (** or __) then italic (* or _)
      // We support __text__ and **text** for bold.
      // We support _text_ and *text* for italic.
      
      const parts = trimmed.split(/(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_)/g);
      const children = parts.map(part => {
        if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
          return new TextRun({ text: part.slice(2, -2), bold: true });
        } else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
          return new TextRun({ text: part.slice(1, -1), italics: true });
        }
        return new TextRun({ text: part });
      });

      paragraphs.push(new Paragraph({
        children: children,
        spacing: { after: 120 }
      }));
    }
  }
  return paragraphs;
};

export const exportToDocx = async (book: GeneratedBook, authorName: string) => {
  // Title Page
  const titlePageChildren = [
    new Paragraph({
      text: book.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 500 }
    }),
    new Paragraph({
      text: book.subtitle,
      heading: HeadingLevel.SUBTITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 2000 }
    }),
    new Paragraph({
      text: `By ${authorName}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 4000 }
    }),
    new Paragraph({
      text: "School of Standard Publisher",
      alignment: AlignmentType.CENTER,
      color: "888888"
    }),
    new Paragraph({
      children: [new PageBreak()]
    })
  ];

  // Copyright Page
  const copyrightChildren = [
    new Paragraph({
      text: `© ${new Date().getFullYear()} ${authorName}. All rights reserved.`,
      alignment: AlignmentType.LEFT
    }),
    new Paragraph({
      text: "Published by School of Standard Publisher.",
      spacing: { after: 500 }
    }),
    new Paragraph({
      children: [new PageBreak()]
    })
  ];

  // Table of Contents
  const tocChildren = [
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 500 }
    }),
    ...book.chapters.map((chap, idx) => 
      new Paragraph({
        text: `Chapter ${idx + 1}: ${chap.title}`,
        spacing: { after: 100 }
      })
    ),
    new Paragraph({
      children: [new PageBreak()]
    })
  ];

  // Chapters
  const chapterChildren = [];
  for (let i = 0; i < book.fullChapters.length; i++) {
    const chapter = book.fullChapters[i];
    
    // Chapter Title
    chapterChildren.push(
      new Paragraph({
        text: `Chapter ${i + 1}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 1000 }
      }),
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
      })
    );

    // Chapter Content
    const contentParagraphs = markdownToDocxParagraphs(chapter.content);
    chapterChildren.push(...contentParagraphs);

    // Page break after chapter unless it's the last one
    if (i < book.fullChapters.length - 1) {
      chapterChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  const doc = new Document({
    creator: "SOS Publishing",
    title: book.title,
    description: book.subtitle,
    sections: [{
      properties: {},
      children: [
        ...titlePageChildren,
        ...copyrightChildren,
        ...tocChildren,
        ...chapterChildren
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveFile(blob, `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
};


// --- EPUB Generation Logic ---

export const exportToEpub = async (book: GeneratedBook, authorName: string) => {
  const zip = new JSZip();
  const safeTitle = book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // 1. Mimetype (must be first, no compression)
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF
  const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
   <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
   </rootfiles>
</container>`;
  zip.folder("META-INF")?.file("container.xml", containerXml);

  // 3. OEBPS Folder
  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("Could not create OEBPS folder");

  // CSS
  const css = `body { font-family: 'Times New Roman', serif; margin: 1em; }
h1, h2, h3 { color: #333; text-align: center; }
p { line-height: 1.6; margin-bottom: 1em; text-align: justify; }`;
  oebps.file("Styles/style.css", css);

  // Chapters & HTML Content
  const chapterFiles: string[] = [];

  // Title Page
  const titleHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${book.title}</title><link rel="stylesheet" href="Styles/style.css" type="text/css"/></head>
<body>
<div style="text-align:center; margin-top: 30%;">
<h1>${book.title}</h1>
<h2>${book.subtitle}</h2>
<h3>By ${authorName}</h3>
</div>
</body></html>`;
  oebps.file("Text/title.xhtml", titleHtml);
  chapterFiles.push("Text/title.xhtml");

  // TOC Page
  let tocLinks = "";
  book.chapters.forEach((ch, i) => {
    tocLinks += `<p><a href="chapter${i+1}.xhtml">Chapter ${i+1}: ${ch.title}</a></p>\n`;
  });
  const tocHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Table of Contents</title><link rel="stylesheet" href="Styles/style.css" type="text/css"/></head>
<body>
<h1>Table of Contents</h1>
${tocLinks}
</body></html>`;
  oebps.file("Text/toc.xhtml", tocHtml);
  chapterFiles.push("Text/toc.xhtml");

  // Chapter Content
  book.fullChapters.forEach((ch, i) => {
    const htmlContent = marked.parse(ch.content); // Convert MD to HTML
    const chapterHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>${ch.title}</title><link rel="stylesheet" href="../Styles/style.css" type="text/css"/></head>
<body>
<div style="text-align: center; margin-bottom: 2em;">
<p style="text-transform: uppercase; font-size: 0.8em; color: #666;">Chapter ${i+1}</p>
<h1>${ch.title}</h1>
</div>
${htmlContent}
</body></html>`;
    const filename = `Text/chapter${i+1}.xhtml`;
    oebps.file(filename, chapterHtml);
    chapterFiles.push(filename);
  });

  // content.opf (Manifest & Spine)
  const manifestItems = chapterFiles.map((f, i) => `<item id="item${i}" href="${f.replace('OEBPS/', '')}" media-type="application/xhtml+xml"/>`).join('\n');
  const spineItems = chapterFiles.map((f, i) => `<itemref idref="item${i}"/>`).join('\n');

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>${book.title}</dc:title>
        <dc:creator>${authorName}</dc:creator>
        <dc:language>en</dc:language>
        <dc:identifier id="BookId" opf:scheme="UUID">urn:uuid:${crypto.randomUUID()}</dc:identifier>
    </metadata>
    <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="style" href="Styles/style.css" media-type="text/css"/>
        ${manifestItems}
    </manifest>
    <spine toc="ncx">
        ${spineItems}
    </spine>
</package>`;
  oebps.file("content.opf", contentOpf);

  // toc.ncx (Navigation)
  const navPoints = book.chapters.map((ch, i) => `
    <navPoint id="navPoint-${i+3}" playOrder="${i+3}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="Text/chapter${i+1}.xhtml"/>
    </navPoint>
  `).join('\n');

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:12345"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle><text>${book.title}</text></docTitle>
    <navMap>
        <navPoint id="navPoint-1" playOrder="1">
            <navLabel><text>Title Page</text></navLabel>
            <content src="Text/title.xhtml"/>
        </navPoint>
        <navPoint id="navPoint-2" playOrder="2">
            <navLabel><text>Table of Contents</text></navLabel>
            <content src="Text/toc.xhtml"/>
        </navPoint>
        ${navPoints}
    </navMap>
</ncx>`;
  oebps.file("toc.ncx", tocNcx);

  // Generate blob
  const content = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
  saveFile(content, `${safeTitle}.epub`);
};