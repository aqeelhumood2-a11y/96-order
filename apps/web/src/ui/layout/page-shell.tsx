import type { ReactNode } from "react";
import { Header, type HeaderProps } from "./header";
import { Footer, type FooterProps } from "./footer";

export interface PageShellProps {
  children: ReactNode;
  header: HeaderProps;
  footer: FooterProps;
}

export function PageShell({ children, header, footer }: PageShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Header {...header} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Footer {...footer} />
    </div>
  );
}
