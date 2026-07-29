import Link from "next/link";
import { Container } from "@/ui/layout/container";
import { Button } from "@/ui/primitives/button";

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-950">Page not found</h1>
      <p className="max-w-sm text-foreground/70">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </Container>
  );
}
