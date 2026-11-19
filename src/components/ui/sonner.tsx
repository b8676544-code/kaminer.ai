"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return <Sonner dir="rtl" position="bottom-left" richColors {...props} />;
}

export { Toaster };
