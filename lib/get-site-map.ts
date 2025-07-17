import { getAllPagesInSpace, getPageProperty, getBlockTitle, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { notion } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId ?? undefined
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

const getPage = async (pageId: string, opts?: any) => {
  console.log('\nnotion getPage', uuidToId(pageId))
  return notion.getPage(pageId, {
    throwOnCollectionErrors: true,
    kyOptions: {
      timeout: 30_000
    },
    ...opts
  })
}

// Utility to convert a string into kebab-case (URL-safe)
const toSlug = (s?: string | null): string =>
  s?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') ?? ''

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId?: string,
  {
    maxDepth = 1
  }: {
    maxDepth?: number
  } = {}
): Promise<Partial<types.SiteMap>> {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage,
    { maxDepth }
  )

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map: Record<string, string>, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        throw new Error(`Error loading page "${pageId}"`)
      }

      const block = recordMap.block[pageId]?.value
      if (
        !(getPageProperty<boolean | null>('Public', block!, recordMap) ?? true)
      ) {
        return map
      }

      const slugProp = getPageProperty<string>('Slug', block, recordMap)
      const title = getBlockTitle(block, recordMap)
      const slug = toSlug(slugProp || title)
      if (!slug) return map

      const category = toSlug(getPageProperty<string>('Category', block, recordMap))
      const locale = toSlug(getPageProperty<string>('Locale', block, recordMap))
      const year = toSlug(getPageProperty<string>('Year', block, recordMap))

      const parts = [locale, year, category, slug].filter(Boolean)
      const fullPath = parts.join('/')

      if (map[fullPath]) {
        console.warn('Duplicate canonical path detected:', {
          fullPath,
          pageId,
          existing: map[fullPath]
        })
        return map
      }

      return {
        ...map,
        [fullPath]: pageId
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
