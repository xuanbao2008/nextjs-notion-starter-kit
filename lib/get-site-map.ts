import { getAllPagesInSpace } from 'notion-utils'
import { pageUrlOverrides, pageUrlAdditions, rootNotionPageId, rootNotionSpaceId } from './config'
import { toSlug } from './to-slug'
import type { SiteMap } from './types'
import siteConfig from 'site.config'

/**
 * Builds the canonical page map and page map for routing and metadata.
 */
export async function getSiteMap(): Promise<SiteMap> {
  // Get full Notion space map
  const rawSiteMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId ?? undefined
  )

  const canonicalPageMap: SiteMap['canonicalPageMap'] = {}
  const pageMap: SiteMap['pageMap'] = rawSiteMap as SiteMap['pageMap']

  // Derive slugs from block metadata
  for (const pageId of Object.keys(pageMap)) {
    const recordMap = pageMap[pageId]
    const block = recordMap?.block?.[pageId]?.value

    if (!block || block.type !== 'page') continue

    const slug = toSlug(block.properties?.Slug?.[0]?.[0] || block.properties?.title?.[0]?.[0])
    const category = toSlug(block.properties?.Category?.[0]?.[0] || '')
    const fullPath = category ? `${category}/${slug}` : slug

    if (slug) {
      canonicalPageMap[fullPath] = pageId
    }
  }

  // Add hard-coded overrides (e.g. /foo -> specific pageId)
  for (const slug in pageUrlOverrides) {
    const pageId = pageUrlOverrides[slug]
    if (pageId) {
      canonicalPageMap[slug] = pageId
    }
  }

  for (const slug in pageUrlAdditions) {
    const pageId = pageUrlAdditions[slug]
    if (pageId) {
      canonicalPageMap[slug] = pageId
    }
  }

  return {
    site: {
      name: siteConfig.name,
      domain: siteConfig.domain,
      rootNotionPageId,
      rootNotionSpaceId
    },
    pageMap,
    canonicalPageMap
  }
}
