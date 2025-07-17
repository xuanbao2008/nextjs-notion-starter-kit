import { getAllPagesInSpace } from 'notion-utils'
import { pageUrlOverrides, pageUrlAdditions, rootNotionPageId, rootNotionSpaceId } from './config'
import { toSlug } from './to-slug'
import type { SiteMap } from './types'
import siteConfig from 'site.config'
import { notion } from './notion-api'

/**
 * Gets a site map of all pages in the workspace (rootNotionSpaceId)
 * and builds mapping from slugs to page IDs.
 */
export async function getSiteMap(): Promise<SiteMap> {
  const rawSiteMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId || undefined,
    notion.getPage
  )

  const canonicalPageMap: SiteMap['canonicalPageMap'] = {}
  const pageMap: SiteMap['pageMap'] = rawSiteMap as SiteMap['pageMap']

  for (const pageId of Object.keys(pageMap)) {
    const recordMap = pageMap[pageId]
    const block = recordMap?.block?.[pageId]?.value

    if (!block || block.type !== 'page') continue

    const props = block.properties as Record<string, any>
    const slug = toSlug(props?.Slug?.[0]?.[0] || props?.title?.[0]?.[0])
    const category = toSlug(props?.Category?.[0]?.[0] || '')
    const fullPath = category ? `${category}/${slug}` : slug

    if (fullPath) {
      canonicalPageMap[fullPath] = pageId
    }
  }

  for (const slug in pageUrlOverrides) {
    const pageId = pageUrlOverrides[slug]
    canonicalPageMap[slug] = pageId
  }

  for (const slug in pageUrlAdditions) {
    const pageId = pageUrlAdditions[slug]
    canonicalPageMap[slug] = pageId
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
