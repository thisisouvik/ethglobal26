"use client";

import { useState } from "react";
import { Plus, Minus } from "@phosphor-icons/react";

interface Faq {
  q: string;
  a: string;
}

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="card overflow-hidden"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <button
            className="w-full flex items-center justify-between gap-4 p-6 text-left"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span className="title-3 text-white">{faq.q}</span>
            <div
              className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-[var(--text-secondary)]"
              style={{
                background: "var(--bg-surface-2)",
                transition: "transform 400ms cubic-bezier(0.22,1,0.36,1)",
                transform: open === i ? "rotate(45deg)" : "rotate(0)",
              }}
            >
              {open === i ? (
                <Minus size={14} weight="bold" />
              ) : (
                <Plus size={14} weight="bold" />
              )}
            </div>
          </button>

          <div
            style={{
              maxHeight: open === i ? "400px" : "0",
              overflow: "hidden",
              transition: "max-height 500ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="px-6 pb-6">
              <p className="body-6 text-[var(--text-secondary)]">{faq.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

