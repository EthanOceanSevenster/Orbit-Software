"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/Button";

/**
 * Printing is also how somebody saves a PDF: every browser's print dialog
 * offers "Save as PDF". That is one button rather than a server-side PDF
 * renderer, and it produces a file the client can forward to a bookkeeper.
 */
export function InvoicePrintButton() {
  return (
    <Button variant="secondary" size="sm" onClick={() => window.print()}>
      <Printer className="h-4 w-4" aria-hidden="true" />
      Print or save as PDF
    </Button>
  );
}
