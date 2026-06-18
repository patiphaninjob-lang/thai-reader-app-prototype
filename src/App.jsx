import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Books,
  BookmarkSimple,
  Check,
  GearSix,
  House,
  Minus,
  Moon,
  Plus,
  Sun,
} from "@phosphor-icons/react";

const books = [
  ["book1", "01", "ผู้รอด", "บันทึกจากเส้นสมมุติของตลาด", "#2d2a24"],
  ["book2", "02", "คนแปลกหน้าฝั่งตรงข้าม", "เรื่องของผู้เล่นในห้องเดียวกัน", "#756b5f"],
  ["book3", "03", "พจนานุกรมของผู้รอด", "คำที่ตลาดสอนผม", "#b46d62"],
  ["book4", "04", "หกฤดูของตลาด", "บันทึกการอ่านฤดูสิบสองปี", "#87916a"],
  ["book5", "05", "เครื่องตัด", "เรื่องของคนที่ฝึกยกมือกด", "#121111"],
  ["book6", "06", "ห้องที่ไม่มีคนดู", "ไดอารี่หนึ่งปีของผู้รอด", "#543b2d"],
  ["book7", "07", "ปลายของเส้น", "จดหมายของผู้รอดถึงคนที่จะเข้าตลาด", "#d6cfbf"],
  ["book8", "08", "คู่มือผู้รอด (ภาคสนาม)", "สิ่งที่หนังสือ ๗ เล่มไม่ได้พูดให้จบ", "#14291c"],
].map(([id, number, title, subtitle, tone]) => ({
  id,
  number,
  title,
  subtitle,
  tone,
  manuscript: `${import.meta.env.BASE_URL}books/${id}.md`,
  cover: `${import.meta.env.BASE_URL}covers/${id}.png`,
}));

const STORAGE_KEY = "thai-reader-state-v1";
const defaultState = {
  activeBookId: "book1",
  progress: {},
  bookmarks: {},
  fontSize: 18,
  leading: 1.78,
  theme: "paper",
};

function readStoredState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return defaultState;
  }
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let quote = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(normalizeParagraph(paragraph));
    paragraph = [];
  };

  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push({ type: "quote", text: quote.join("\n") });
    quote = [];
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed === "```") {
      flushParagraph();
      flushQuote();
      const code = [];
      lineIndex += 1;
      while (lineIndex < lines.length && lines[lineIndex].trim() !== "```") {
        code.push(lines[lineIndex].trimEnd());
        lineIndex += 1;
      }
      blocks.push(parseFencedCode(code.join("\n")));
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushQuote();
      continue;
    }

    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      flushQuote();
      blocks.push({ type: "divider" });
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushQuote();
      blocks.push({ type: `h${Math.min(heading[1].length, 3)}`, text: heading[2] });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      quote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    if (isTableLine(trimmed)) {
      flushParagraph();
      flushQuote();
      const tableLines = [trimmed];
      while (lineIndex + 1 < lines.length && isTableLine(lines[lineIndex + 1].trim())) {
        lineIndex += 1;
        tableLines.push(lines[lineIndex].trim());
      }
      blocks.push(parseTable(tableLines));
      continue;
    }

    if (isChecklistLine(trimmed)) {
      flushParagraph();
      flushQuote();
      const items = [parseChecklistLine(trimmed)];
      while (lineIndex + 1 < lines.length && isChecklistLine(lines[lineIndex + 1].trim())) {
        lineIndex += 1;
        items.push(parseChecklistLine(lines[lineIndex].trim()));
      }
      blocks.push({ type: "checklist", items });
      continue;
    }

    if (isBulletLine(trimmed)) {
      flushParagraph();
      flushQuote();
      const items = [parseBulletLine(trimmed)];
      while (lineIndex + 1 < lines.length && isBulletLine(lines[lineIndex + 1].trim())) {
        lineIndex += 1;
        items.push(parseBulletLine(lines[lineIndex].trim()));
      }
      blocks.push({ type: "list", items });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushQuote();
  return blocks;
}

function normalizeParagraph(lines) {
  const text = lines.join("\n");
  return { type: "p", text };
}

function isTableLine(line) {
  return /^\|.+\|$/.test(line);
}

function isTableSeparator(line) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line);
}

function parseTable(lines) {
  const rows = lines.map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));

  if (rows.length >= 2 && isTableSeparator(lines[1])) {
    return { type: "table", headers: rows[0], rows: rows.slice(2) };
  }

  return { type: "p", text: lines.join("\n") };
}

function isChecklistLine(line) {
  return /^(☐|\[ \]|- \[ \])\s+/.test(line);
}

function parseChecklistLine(line) {
  return line.replace(/^(☐|\[ \]|- \[ \])\s+/, "");
}

function isBulletLine(line) {
  return /^[-*]\s+/.test(line);
}

function parseBulletLine(line) {
  return line.replace(/^[-*]\s+/, "");
}

function parseFencedCode(code) {
  const callout = parseBoxCallout(code);
  if (callout) return callout;
  return { type: "code", text: code };
}

function parseBoxCallout(code) {
  const lines = code.split("\n").filter((line) => line.trim());

  if (!lines.some((line) => /^[┌├└│]/.test(line.trim()))) {
    return null;
  }

  const content = lines
    .filter((line) => !/^[┌├└]/.test(line.trim()))
    .map((line) => line.replace(/^\s*│\s?/, "").replace(/\s*│\s*$/, "").trimEnd());
  const firstContentIndex = content.findIndex((line) => line.trim());

  if (firstContentIndex === -1) {
    return null;
  }

  const title = content[firstContentIndex].trim();
  const body = trimEmptyLines(content.slice(firstContentIndex + 1));
  return {
    type: "callout",
    title,
    variant: calloutVariant(title),
    body,
  };
}

function trimEmptyLines(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;
  return lines.slice(start, end);
}

function calloutVariant(title) {
  if (/WARNING/i.test(title)) return "warning";
  if (/ACTION/i.test(title)) return "action";
  if (/KEY CONCEPT/i.test(title)) return "key";
  if (/CASE STUDY/i.test(title)) return "case";
  return "note";
}

function quoteToCallout(text) {
  const warning = text.match(/^⚠️\s*(WARNING)\s*:\s*(.+)$/i);
  if (!warning) return null;

  return {
    title: `⚠️ ${warning[1].toUpperCase()}`,
    variant: "warning",
    body: [warning[2]],
  };
}

function renderCallout(block, index) {
  return (
    <section className={`manual-callout manual-callout-${block.variant}`} key={index} data-block-index={index}>
      <div className="manual-callout-kicker">{block.title}</div>
      <div className="manual-callout-body">
        {block.body.map((line, lineIndex) => {
          const displayLine = cleanManualLine(line);
          if (!displayLine.trim()) return <div className="manual-callout-gap" key={lineIndex} />;
          if (line.includes("│")) {
            const cells = line.split("│").map(cleanManualLine).filter(Boolean);
            if (cells.length) {
              return (
                <div className="manual-matrix-row" key={lineIndex}>
                  {cells.map((cell, cellIndex) => (
                    <span key={cellIndex}>
                      <InlineText text={cell} />
                    </span>
                  ))}
                </div>
              );
            }
          }
          return (
            <p key={lineIndex}>
              <InlineText text={displayLine} />
            </p>
          );
        })}
      </div>
    </section>
  );
}

function cleanManualLine(line) {
  return line
    .replace(/[┌┐└┘├┤│]/g, "")
    .replace(/[─━]+/g, " — ")
    .replace(/\s+—\s+(?=—)/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function InlineText({ text }) {
  const pieces = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) pieces.push({ type: "text", value: text.slice(lastIndex, match.index) });
    const token = match[0];
    pieces.push({
      type: token.startsWith("**") ? "strong" : "em",
      value: token.replace(/^\*{1,2}|\*{1,2}$/g, ""),
    });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) pieces.push({ type: "text", value: text.slice(lastIndex) });

  return pieces.map((piece, index) => {
    if (piece.type === "strong") return <strong key={index}>{piece.value}</strong>;
    if (piece.type === "em") return <em key={index}>{piece.value}</em>;
    return <span key={index}>{piece.value}</span>;
  });
}

function useBookText(book) {
  const [state, setState] = useState({ status: "loading", text: "", warning: "" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", text: "", warning: "" });

    fetch(book.manuscript)
      .then((response) => {
        if (!response.ok) throw new Error(`โหลดไฟล์ไม่สำเร็จ (${response.status})`);
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        const warning = /[\u0080-\u009f\ufffd]/.test(text) ? "พบอักขระที่อาจเกิดจาก encoding เพี้ยน" : "";
        setState({ status: "ready", text, warning });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: "error", text: "", warning: error.message });
      });

    return () => {
      cancelled = true;
    };
  }, [book]);

  return state;
}

function getWordStats(text) {
  if (!text) return { words: 0, minutes: 0 };
  if ("Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("th", { granularity: "word" });
    const words = Array.from(segmenter.segment(text)).filter((item) => item.isWordLike).length;
    return { words, minutes: Math.max(1, Math.round(words / 230)) };
  }
  const words = Math.round(text.replace(/\s+/g, "").length / 5);
  return { words, minutes: Math.max(1, Math.round(words / 230)) };
}

function percent(value) {
  return Math.round((value || 0) * 100);
}

function App() {
  const [stored, setStored] = useState(readStoredState);
  const [tab, setTab] = useState("library");
  const [showToc, setShowToc] = useState(false);
  const [notice, setNotice] = useState("");
  const readerRef = useRef(null);

  const activeBook = books.find((book) => book.id === stored.activeBookId) || books[0];
  const bookText = useBookText(activeBook);
  const blocks = useMemo(() => parseMarkdown(bookText.text), [bookText.text]);
  const stats = useMemo(() => getWordStats(bookText.text), [bookText.text]);
  const headings = useMemo(
    () =>
      blocks
        .map((block, index) => ({ ...block, index }))
        .filter((block) => block.type === "h2" || block.type === "h3")
        .slice(0, 36),
    [blocks],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }, [stored]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const node = readerRef.current;
    if (!node || bookText.status !== "ready") return;
    const saved = stored.progress[activeBook.id] || 0;
    requestAnimationFrame(() => {
      node.scrollTop = saved * Math.max(1, node.scrollHeight - node.clientHeight);
    });
  }, [activeBook.id, bookText.status]);

  const updateStored = (patch) => setStored((current) => ({ ...current, ...patch }));
  const notify = (message) => setNotice(message);

  const selectBook = (bookId, nextTab = "reader") => {
    updateStored({ activeBookId: bookId });
    setTab(nextTab);
    setShowToc(false);
  };

  const saveProgress = () => {
    const node = readerRef.current;
    if (!node) return;
    const ratio = node.scrollTop / Math.max(1, node.scrollHeight - node.clientHeight);
    setStored((current) => ({
      ...current,
      progress: { ...current.progress, [activeBook.id]: Math.max(0, Math.min(1, ratio)) },
    }));
  };

  const addBookmark = () => {
    const node = readerRef.current;
    const ratio = node ? node.scrollTop / Math.max(1, node.scrollHeight - node.clientHeight) : 0;
    const nearestHeading =
      headings
        .slice()
        .reverse()
        .find((heading) => {
          const element = document.querySelector(`[data-block-index="${heading.index}"]`);
          return element && node && element.offsetTop <= node.scrollTop + 120;
        }) || headings[0];

    setStored((current) => ({
      ...current,
      bookmarks: {
        ...current.bookmarks,
        [activeBook.id]: {
          ratio: Math.max(0, Math.min(1, ratio)),
          label: nearestHeading?.text || activeBook.title,
          savedAt: new Date().toISOString(),
        },
      },
      progress: { ...current.progress, [activeBook.id]: Math.max(0, Math.min(1, ratio)) },
    }));
    notify("คั่นหน้าแล้ว");
  };

  const jumpToBookmark = () => {
    const node = readerRef.current;
    const bookmark = stored.bookmarks[activeBook.id];
    if (!node || !bookmark) return;
    node.scrollTo({
      top: bookmark.ratio * Math.max(1, node.scrollHeight - node.clientHeight),
      behavior: "smooth",
    });
    notify("กลับไปที่คั่นหน้าแล้ว");
  };

  const jumpToBlock = (index) => {
    const node = readerRef.current;
    const element = document.querySelector(`[data-block-index="${index}"]`);
    if (!node || !element) return;
    node.scrollTo({ top: Math.max(0, element.offsetTop - 96), behavior: "smooth" });
    setShowToc(false);
    notify("ไปที่หัวข้อแล้ว");
  };

  const renderBlock = (block, index) => {
    if (block.type === "divider") return <hr key={index} className="reader-divider" />;
    if (block.type === "quote") {
      const callout = quoteToCallout(block.text);
      if (callout) {
        return renderCallout(callout, index);
      }

      return (
        <blockquote key={index} data-block-index={index}>
          <InlineText text={block.text} />
        </blockquote>
      );
    }
    if (block.type === "callout") return renderCallout(block, index);
    if (block.type === "table") {
      return (
        <div className="manual-table-wrap" key={index} data-block-index={index}>
          <table className="manual-table">
            <thead>
              <tr>
                {block.headers.map((header, headerIndex) => (
                  <th key={headerIndex}>
                    <InlineText text={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (block.type === "checklist") {
      return (
        <ul className="manual-checklist" key={index} data-block-index={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <span aria-hidden="true" />
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "list") {
      return (
        <ul className="reader-list" key={index} data-block-index={index}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    }
    if (block.type === "code") {
      return (
        <pre className="manual-code" key={index} data-block-index={index}>
          {block.text}
        </pre>
      );
    }
    if (block.type === "h1") {
      return (
        <h1 key={index} data-block-index={index}>
          <InlineText text={block.text} />
        </h1>
      );
    }
    if (block.type === "h2") {
      return (
        <h2 key={index} data-block-index={index}>
          <InlineText text={block.text} />
        </h2>
      );
    }
    if (block.type === "h3") {
      return (
        <h3 key={index} data-block-index={index}>
          <InlineText text={block.text} />
        </h3>
      );
    }
    return (
      <p key={index} data-block-index={index}>
        <InlineText text={block.text} />
      </p>
    );
  };

  const currentProgress = stored.progress[activeBook.id] || 0;
  const currentBookmark = stored.bookmarks[activeBook.id];

  return (
    <div className={`app-shell theme-${stored.theme}`}>
      <div className="statusbar" aria-hidden="true">
        <span>9:41</span>
        <span>●●●</span>
      </div>

      {tab === "library" && (
        <section className="screen library-screen">
          <header className="library-header">
            <p>คนหลังกราฟ</p>
            <h1>ห้องสมุด</h1>
            <span>ทั้งหมด 8 เล่ม</span>
          </header>

          <button
            className="continue-panel has-tip"
            type="button"
            onClick={() => selectBook(activeBook.id)}
            data-tip="อ่านต่อจากตำแหน่งล่าสุด"
          >
            <img src={activeBook.cover} alt="" />
            <div>
              <span className="eyebrow">อ่านต่อ</span>
              <h2>{activeBook.title}</h2>
              <p>{activeBook.subtitle}</p>
              <div className="progress-line">
                <span style={{ width: `${percent(currentProgress)}%` }} />
              </div>
              <small>{percent(currentProgress)}% {currentBookmark ? `· คั่นหน้า: ${currentBookmark.label}` : ""}</small>
            </div>
          </button>

          <div className="book-grid" aria-label="รายการหนังสือ 8 เล่ม">
            {books.map((book) => {
              const progressValue = stored.progress[book.id] || 0;
              const hasBookmark = Boolean(stored.bookmarks[book.id]);
              return (
                <button
                  className="book-card has-tip"
                  type="button"
                  key={book.id}
                  onClick={() => selectBook(book.id)}
                  style={{ "--book-tone": book.tone }}
                  data-tip={`เปิดอ่าน ${book.title}`}
                >
                  <span className="book-number">{book.number}</span>
                  <img src={book.cover} alt={`ปก ${book.title}`} />
                  <strong>{book.title}</strong>
                  <small>{percent(progressValue)}% {hasBookmark ? "· คั่นหน้า" : ""}</small>
                  <span className="mini-progress">
                    <span style={{ width: `${percent(progressValue)}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {tab === "reader" && (
        <section className="screen reader-screen">
          <header className="reader-topbar">
            <button
              type="button"
              className="icon-button has-tip"
              onClick={() => setTab("library")}
              aria-label="กลับห้องสมุด"
              data-tip="กลับห้องสมุด"
            >
              <ArrowLeft size={21} />
            </button>
            <div>
              <span>{activeBook.number}</span>
              <strong>{activeBook.title}</strong>
            </div>
            <button
              type="button"
              className={`icon-button filled has-tip ${currentBookmark ? "is-saved" : ""}`}
              onClick={addBookmark}
              aria-label="คั่นหน้า"
              aria-pressed={Boolean(currentBookmark)}
              data-tip={currentBookmark ? "คั่นหน้าแล้ว กดเพื่ออัปเดตตำแหน่ง" : "คั่นหน้าตำแหน่งปัจจุบัน"}
            >
              <BookmarkSimple size={21} weight="fill" />
            </button>
          </header>

          <main
            className="reader"
            ref={readerRef}
            onScroll={saveProgress}
            style={{ "--reader-font": `${stored.fontSize}px`, "--reader-leading": stored.leading }}
          >
            {bookText.status === "loading" && <div className="loading">กำลังเปิดหนังสือ...</div>}
            {bookText.status === "error" && <div className="loading">{bookText.warning}</div>}
            {bookText.status === "ready" && (
              <>
                {bookText.warning && <div className="source-warning">{bookText.warning}</div>}
                <article className={activeBook.id === "book8" ? "field-manual" : ""}>{blocks.map(renderBlock)}</article>
              </>
            )}
          </main>

          {showToc && (
            <div className="toc-panel">
              <div className="toc-header">
                <strong>สารบัญ</strong>
                <button
                  type="button"
                  className="has-tip"
                  onClick={() => setShowToc(false)}
                  data-tip="ปิดสารบัญ"
                >
                  ปิด
                </button>
              </div>
              <div className="toc-list">
                {headings.map((heading) => (
                  <button type="button" key={`${heading.index}-${heading.text}`} onClick={() => jumpToBlock(heading.index)}>
                    {heading.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer className="reading-controls">
            <button
              type="button"
              className="has-tip"
              onClick={() => {
                setShowToc(true);
                notify("เปิดสารบัญแล้ว");
              }}
              aria-label="สารบัญ"
              data-tip="เปิดสารบัญ"
            >
              <Books size={20} />
            </button>
            <button
              type="button"
              className={`has-tip ${currentBookmark ? "is-saved" : ""}`}
              onClick={jumpToBookmark}
              disabled={!currentBookmark}
              aria-label="ไปที่คั่นหน้า"
              data-tip={currentBookmark ? "กลับไปตำแหน่งที่คั่นไว้" : "ยังไม่มีคั่นหน้า"}
            >
              <BookmarkSimple size={20} weight={currentBookmark ? "fill" : "regular"} />
            </button>
            <div className="read-meter">
              <span style={{ width: `${percent(currentProgress)}%` }} />
            </div>
            <span>{percent(currentProgress)}%</span>
          </footer>
        </section>
      )}

      {tab === "settings" && (
        <section className="screen settings-screen">
          <header className="library-header compact">
            <p>รูปเล่มในแอพ</p>
            <h1>ตั้งค่าการอ่าน</h1>
            <span>{stats.minutes} นาที โดยประมาณ</span>
          </header>

          <div className="settings-group">
            <div className="setting-row">
              <div>
                <strong>ขนาดตัวอักษร</strong>
                <span>{stored.fontSize}px</span>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  className="has-tip"
                  onClick={() => {
                    updateStored({ fontSize: Math.max(16, stored.fontSize - 1) });
                    notify("ลดขนาดตัวอักษรแล้ว");
                  }}
                  data-tip="ลดขนาดตัวอักษร"
                >
                  <Minus size={18} />
                </button>
                <button
                  type="button"
                  className="has-tip"
                  onClick={() => {
                    updateStored({ fontSize: Math.min(23, stored.fontSize + 1) });
                    notify("เพิ่มขนาดตัวอักษรแล้ว");
                  }}
                  data-tip="เพิ่มขนาดตัวอักษร"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <strong>ระยะบรรทัด</strong>
                <span>{stored.leading.toFixed(2)}</span>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  className="has-tip"
                  onClick={() => {
                    updateStored({ leading: Math.max(1.55, +(stored.leading - 0.05).toFixed(2)) });
                    notify("ลดระยะบรรทัดแล้ว");
                  }}
                  data-tip="ลดระยะบรรทัด"
                >
                  <Minus size={18} />
                </button>
                <button
                  type="button"
                  className="has-tip"
                  onClick={() => {
                    updateStored({ leading: Math.min(2, +(stored.leading + 0.05).toFixed(2)) });
                    notify("เพิ่มระยะบรรทัดแล้ว");
                  }}
                  data-tip="เพิ่มระยะบรรทัด"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="segmented">
              <button
                type="button"
                className={`has-tip ${stored.theme === "paper" ? "active" : ""}`}
                onClick={() => {
                  updateStored({ theme: "paper" });
                  notify("เปลี่ยนเป็นโหมดกระดาษแล้ว");
                }}
                data-tip="พื้นหลังสว่างแบบกระดาษ"
              >
                <Sun size={18} /> กระดาษ
              </button>
              <button
                type="button"
                className={`has-tip ${stored.theme === "night" ? "active" : ""}`}
                onClick={() => {
                  updateStored({ theme: "night" });
                  notify("เปลี่ยนเป็นโหมดกลางคืนแล้ว");
                }}
                data-tip="พื้นหลังมืดสำหรับอ่านกลางคืน"
              >
                <Moon size={18} /> กลางคืน
              </button>
            </div>
          </div>

          <div className="source-card">
            <Check size={22} />
            <div>
              <strong>โหมดรักษาต้นฉบับ</strong>
              <p>แอพโหลด Markdown จากไฟล์หนังสือโดยตรงและจัดรูปแบบเฉพาะการแสดงผล</p>
            </div>
          </div>
        </section>
      )}

      {notice && (
        <div className="action-toast" role="status" aria-live="polite">
          {notice}
        </div>
      )}

      <nav className="tabbar" aria-label="เมนูหลัก">
        <button
          type="button"
          className={`has-tip ${tab === "library" ? "active" : ""}`}
          onClick={() => setTab("library")}
          data-tip="ดูหนังสือทั้ง 8 เล่ม"
        >
          <House size={22} weight={tab === "library" ? "fill" : "regular"} />
          <span>ห้องสมุด</span>
        </button>
        <button
          type="button"
          className={`has-tip ${tab === "reader" ? "active" : ""}`}
          onClick={() => setTab("reader")}
          data-tip="กลับไปอ่านเล่มปัจจุบัน"
        >
          <BookOpen size={22} weight={tab === "reader" ? "fill" : "regular"} />
          <span>อ่าน</span>
        </button>
        <button
          type="button"
          className={`has-tip ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
          data-tip="ปรับรูปเล่มและโหมดอ่าน"
        >
          <GearSix size={22} weight={tab === "settings" ? "fill" : "regular"} />
          <span>ตั้งค่า</span>
        </button>
      </nav>
    </div>
  );
}

export { App };
