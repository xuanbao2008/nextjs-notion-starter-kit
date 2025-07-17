import * as config from './config'
import { notion } from './notion-api'
import { toSlug } from './to-slug'
import type { SiteMap } from './types'

export async function getSiteMap(): Promise<SiteMap> {
  const pageMap: SiteMap['pageMap'] = {}
  const canonicalPageMap: SiteMap['canonicalPageMap'] = {}

  const rootPageId = config.rootNotionPageId
  const recordMap = await notion.getPage(rootPageId)

  pageMap[rootPageId] = recordMap

  const keys = Object.keys(recordMap.block || {})
  for (const key of keys) {
    const block = recordMap.block[key]?.value
    if (!block || block.type !== 'page') continue

    const slug = toSlug(block.properties?.Slug?.[0]?.[0] || block.properties?.title?.[0]?.[0])
    const category = toSlug(block.properties?.Category?.[0]?.[0] || '')
    const fullPath = category ? `${category}/${slug}` : slug

    canonicalPageMap[fullPath] = block.id
  }

  return {
    site: {
      name: config.name,
      domain: config.domain,
      rootNotionPageId: config.rootNotionPageId
    },
    pageMap,
    canonicalPageMap
  }
}
