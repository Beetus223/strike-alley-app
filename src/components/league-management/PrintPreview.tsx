import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

/**
 * On-screen print preview. It CLONES the real printable element already on the page (same markup,
 * same classes, same data), lays it out on US Letter paper at 96 px/in, and paginates it. Printing
 * from here calls window.print(), which prints that same element via the existing print CSS.
 */
const DPI = 96;
const PAPER = {
  portrait: { w: 8.5 * DPI, h: 11 * DPI, m: 0.5 * DPI },
  landscape: { w: 11 * DPI, h: 8.5 * DPI, m: 0.3 * DPI },
};

type Page = { node: HTMLElement; offset: number; height: number; overflow: boolean };

export function PrintPreview({
  open, onClose, targetId, orientation, mode, title,
}: {
  open: boolean; onClose: () => void; targetId: string;
  orientation: "portrait" | "landscape";
  /** "cards": each .lane-card is its own sheet. "flow": continuous document split at row/heading boundaries. */
  mode: "cards" | "flow";
  title: string;
}) {
  const paper = PAPER[orientation];
  const cw = paper.w - paper.m * 2, ch = paper.h - paper.m * 2;
  const measureRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState<"width" | "page" | null>("width");

  useLayoutEffect(() => {
    if (!open || !measureRef.current) return;
    const src = document.getElementById(targetId);
    const box = measureRef.current;
    box.innerHTML = "";
    if (!src) { setPages([]); return; }
    const strip = (el: HTMLElement) => { el.removeAttribute("id"); el.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id")); return el; };
    const out: Page[] = [];
    if (mode === "cards") {
      for (const card of Array.from(src.querySelectorAll<HTMLElement>(".lane-card"))) {
        const c = strip(card.cloneNode(true) as HTMLElement);
        box.appendChild(c);
        const h = c.scrollHeight;
        out.push({ node: c, offset: 0, height: Math.min(h, ch), overflow: h > ch + 1 });
      }
    } else {
      const c = strip(src.cloneNode(true) as HTMLElement);
      box.appendChild(c);
      const top = c.getBoundingClientRect().top;
      const total = c.scrollHeight;
      // Candidate break points: bottoms of rows, headings and blocks — never inside a table row.
      const cuts = Array.from(c.querySelectorAll<HTMLElement>("tr, h3, h4, p, li, header, table, section, article > div, ul"))
        .map((el) => el.getBoundingClientRect().bottom - top).filter((y) => y > 0).sort((a, b) => a - b);
      let start = 0;
      while (start < total - 1) {
        const limit = start + ch;
        let end = total <= limit ? total : cuts.filter((y) => y > start + 40 && y <= limit).pop() ?? limit;
        if (end <= start) end = limit;
        out.push({ node: c, offset: start, height: end - start, overflow: false });
        start = end;
      }
    }
    setPages(out);
  }, [open, targetId, mode, ch]);

  useEffect(() => {
    if (!open || !fit) return;
    const calc = () => {
      const v = viewRef.current; if (!v) return;
      const zw = (v.clientWidth - 48) / paper.w, zh = (v.clientHeight - 48) / paper.h;
      setZoom(Math.max(0.25, Math.min(2, fit === "width" ? zw : Math.min(zw, zh))));
    };
    calc(); window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [open, fit, paper.w, paper.h]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);

  if (!open) return null;
  const step = (d: number) => { setFit(null); setZoom((z) => Math.max(0.25, Math.min(2, +(z + d).toFixed(2)))); };
  const overflowCount = pages.filter((p) => p.overflow).length;

  return createPortal(
    <div className="pp-overlay fixed inset-0 z-[100] flex flex-col bg-background/95" role="dialog" aria-modal="true" aria-label={`Print preview: ${title}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <p className="mr-auto font-semibold">{title} <span className="text-sm font-normal text-muted-foreground">· Letter {orientation} · {pages.length} page{pages.length === 1 ? "" : "s"}</span></p>
        <Button variant="outline" size="sm" onClick={() => step(-0.1)} aria-label="Zoom out">−</Button>
        <span className="w-14 text-center text-sm tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="sm" onClick={() => step(0.1)} aria-label="Zoom in">+</Button>
        <Button variant={fit === "width" ? "default" : "outline"} size="sm" onClick={() => setFit("width")}>Fit width</Button>
        <Button variant={fit === "page" ? "default" : "outline"} size="sm" onClick={() => setFit("page")}>Fit page</Button>
        <Button size="sm" onClick={() => window.print()}>Print</Button>
        <Button variant="outline" size="sm" onClick={onClose}>Close preview</Button>
      </div>
      {overflowCount > 0 && (
        <p className="bg-primary/10 px-4 py-2 text-sm text-primary">{overflowCount} sheet{overflowCount > 1 ? "s are" : " is"} taller than one page and will continue onto an extra sheet when printed.</p>
      )}
      <div ref={viewRef} className="pp-desk flex-1 overflow-auto p-6">
        <div className="mx-auto flex flex-col items-center gap-6" style={{ width: paper.w * zoom }}>
          {pages.map((p, i) => (
            <div key={i} style={{ width: paper.w * zoom, height: paper.h * zoom }}>
              <div className="pp-paper relative" style={{ width: paper.w, height: paper.h, padding: paper.m, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                <div className="overflow-hidden" style={{ width: cw, height: p.height }}>
                  <Clone node={p.node} offset={p.offset} />
                </div>
                <span className="pp-pageno absolute bottom-2 right-4">Page {i + 1} of {pages.length}</span>
              </div>
            </div>
          ))}
          {!pages.length && <p className="text-muted-foreground">Nothing to preview.</p>}
        </div>
      </div>
      {/* Off-screen layout box at the exact printable width, using the print-scope styles. */}
      <div aria-hidden className={`pp-measure pp-scope-${mode}`} style={{ position: "fixed", left: -10000, top: 0, width: cw }} ref={measureRef} />
    </div>,
    document.body,
  );
}

function Clone({ node, offset }: { node: HTMLElement; offset: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    el.innerHTML = "";
    el.appendChild(node.cloneNode(true));
  }, [node]);
  return <div ref={ref} className="pp-scope" style={{ transform: `translateY(${-offset}px)` }} />;
}
