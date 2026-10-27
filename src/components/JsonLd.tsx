import { serializeJsonLd } from '@/lib/structured-data';

/** schema.org data for search engines; invisible to visitors. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
