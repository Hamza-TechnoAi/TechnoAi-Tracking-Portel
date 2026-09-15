import { SITE } from '../../../Constants/site';

/**
 * Per-page SEO metadata. React 19 automatically hoists <title> and <meta>
 * tags rendered anywhere in the tree up into the document <head>.
 *
 * Usage (inside a page):
 *   <Seo
 *     title="Outdoor Advertising in Dubai | Media 24x7"
 *     description="..."
 *     path="/about"
 *   />
 *
 * Keep exactly ONE <h1> per page in the page markup itself; this component
 * only manages head metadata, not on-page headings.
 */
export default function Seo({
  title,
  description,
  path = '',
  image = SITE.defaultImage,
  noindex = false,
}) {
  const fullTitle = title ?? SITE.defaultTitle;
  const desc = description ?? SITE.defaultDescription;
  const url = `${SITE.url}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}
