import type { ReactNode } from "react";
import { PageShell } from "@/ui/layout/page-shell";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return <PageShell>{children}</PageShell>;
}
