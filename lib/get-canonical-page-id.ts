import { type ExtendedRecordMap } from 'notion-types'

import { getBlockTitle } from './get-block-title'
import { getPageProperty } from './get-page-property'
import { normalizeTitle } from './normalize-title'
import { uuidToId } from './uuid-to-id'

/**
 * Gets the canonical, display-friendly version of a page's ID for use in URLs.
 * Falls back to ID if title/slug not found.
 */
export const getCanonicalPageId = (
  pageId: string,
  recordMap: ExtendedRecordMap,
  { uuid = true }: { uuid?: boolean } = {}
): string | null => {
  if (!pageId || !recordMap) return null

  const id = uuidToId(pageId)
  const block = recordMap.block?.[pageId]?.value

  if (!block) return id

  const locale = normalizeTitle(
    getPageProperty('Locale', block, recordMap) || ''
  )

  const category = normalizeTitle(
    getPageProperty('Category', block, recordMap) || ''
  )

  const slug = normalizeTitle(
    getPageProperty('slug', block, recordMap) ||
    getPageProperty('Slug', block, recordMap) ||
    getBlockTitle(block, recordMap)
  )

  if (!slug) return id

  const segments = [locale, category, slug].filter(Boolean)

  return uuid ? segments.join('/') : slug
}
