"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="sg-btn-primary print:hidden">
      🖨 Print / Save as PDF
    </button>
  );
}
