import type { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer />
    </div>
  );
}
