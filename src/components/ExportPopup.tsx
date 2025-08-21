import React, { useEffect, useRef } from "react";
import { FiDownload, FiX } from "react-icons/fi";

// --- Types ---
export type CalendarEvent = {
  id?: string; // optional internal id
  uid?: string; // if not provided, will be generated
  title: string;
  description?: string;
  location?: string;
  start: string | Date; // ISO string or Date
  end: string | Date;   // ISO string or Date
  // Optional extra fields you may add later (reminders, attendees, etc.)
};

export type ExportModalProps = {
  open: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  calendarName?: string; // e.g., "My Matches"
  onAddToGoogle?: (events: CalendarEvent[]) => Promise<void> | void; // parent handles OAuth + insert
};

// --- Utilities ---
const toUTC = (d: string | Date) => {
  const date = typeof d === "string" ? new Date(d) : d;
  // ICS wants local time or UTC. We'll use UTC (with trailing Z)
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
};

const fold = (line: string) => {
  // Fold long lines to 75 octets as per RFC 5545 (approximate by 75 chars)
  const max = 74; // we will prefix continuation with one space
  if (line.length <= max) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + max);
    parts.push(i === 0 ? chunk : " " + chunk);
    i += max;
  }
  return parts.join("\r\n");
};

function buildICS(events: CalendarEvent[], calendarName = "Events") {
  const CRLF = "\r\n";
  const escape = (v?: string) =>
    (v || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const now = toUTC(new Date());
  const header = [
    "BEGIN:VCALENDAR",
    "PRODID:-//Sports Scheduler//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escape(calendarName)}`,
  ].join(CRLF);

  const body = events
    .map((e) => {
      const uid = e.uid || `${Date.now()}-${Math.random().toString(36).slice(2)}@sports-scheduler`;
      const fields = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${toUTC(e.start)}`,
        `DTEND:${toUTC(e.end)}`,
        fold(`SUMMARY:${escape(e.title)}`),
        e.description ? fold(`DESCRIPTION:${escape(e.description)}`) : undefined,
        e.location ? fold(`LOCATION:${escape(e.location)}`) : undefined,
        "END:VEVENT",
      ].filter(Boolean);
      return fields.join(CRLF);
    })
    .join(CRLF);

  const footer = "END:VCALENDAR";
  return [header, body, footer].join(CRLF) + CRLF;
}

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Component ---
export function ExportModal({ open, onClose, events, calendarName = "Events", onAddToGoogle }: ExportModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Basic focus management + ESC key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // focus close button by default
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const disabled = events.length === 0;

  const onDownloadICS = () => {
    if (!events.length) return;
    const ics = buildICS(events, calendarName);
    const safeName = calendarName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    triggerDownload(`${safeName || "events"}.ics`, ics);
  };

  const onGoogle = async () => {
    if (!onAddToGoogle) return;
    await onAddToGoogle(events);
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="export-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 id="export-title" className="text-lg font-semibold text-primary">
            Export your events
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600">
            Choose how you want to add <span className="font-bold">{events.length}</span> event{events.length === 1 ? "" : "s"} from
            <span className="ml-1 font-bold">{calendarName}</span> to your calendar.
          </p>

          <button
            onClick={onDownloadICS}
            disabled={disabled}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 border border-gray-200 bg-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiDownload className="h-5 w-5" />
            <span className="font-medium">Download .ics file</span>
          </button>

          <button
            onClick={onGoogle}
            // disabled={!onAddToGoogle || disabled}
            disabled={true}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-selected-card text-white hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* Simple Google "G" (text), replace with SVG if you have assets */}
            <span className="font-bold text-base">G</span>
            <span className="font-medium">Add to Google Calendar</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 flex items-center justify-end gap-2 border-t border-gray-100">
          <button
            onClick={onClose}
            className="text-sm px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
