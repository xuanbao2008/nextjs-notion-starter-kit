import { type ExtendedRecordMap } from 'notion-types'

import type { Site } from './types'
import { toSlug } from './to-slug'

export const mapPageUrl = (
  site: Site,
  recordMap: ExtendedRecordMap,
  searchParams?: URLSearchParams
) => (pageId = '') => {
  const block = recordMap.block?.[pageId]?.value
  if (!block) return `/`

  const slug = toSlug(block.properties?.Slug?.[0]?.[0] || block.properties?.title?.[0]?.[0])
  const category = toSlug(block.properties?.Category?.[0]?.[0] || '')

  const pathname = category ? `/${category}/${slug}` : `/${slug}`
  return searchParams ? `${pathname}?${searchParams.toString()}` : pathname
}

export const getCanonicalPageUrl = (
  site: Site,
  recordMap: ExtendedRecordMap
) => (pageId = '') => {
  const baseUrl = `https://${site.domain}`
  return baseUrl + mapPageUrl(site, recordMap)(pageId)
}
