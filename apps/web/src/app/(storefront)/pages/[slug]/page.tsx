import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/ui/layout/container";
import { getPublicCmsPage } from "@/services/cms/get-public-page";

export const dynamic = "force-dynamic";

interface CmsPageRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CmsPageRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicCmsPage(slug);
  if (!page) return {};
  return { title: page.seoTitle ?? page.title, description: page.seoDescription };
}

export default async function CmsPageRoute({ params }: CmsPageRouteProps) {
  const { slug } = await params;
  const page = await getPublicCmsPage(slug);
  if (!page) notFound();

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-brand-950">{page.title}</h1>
      <div className="prose prose-sm mt-6 max-w-none whitespace-pre-line text-foreground/80">{page.content}</div>
    </Container>
  );
}
