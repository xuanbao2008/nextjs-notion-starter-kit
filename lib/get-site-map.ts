import { getAllPagesInSpace, getBlockTitle, getPageProperty, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import type * as types from './types'
import * as config from './config'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
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

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

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
    {
      maxDepth
    }
  )

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map: Record<string, string>, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        throw new Error(`Error loading page "${pageId}"`)
      }

      const block = recordMap.block?.[pageId]?.value
      if (!block) {
        return map
      }

      // Check if public
      const isPublic = getPageProperty<boolean | null>('Public', block, recordMap)
      if (isPublic === false) {
        return map
      }

      const slugProp = getPageProperty<string>('Slug', block, recordMap)
      const category = getPageProperty<string>('Category', block, recordMap)
      const title = getBlockTitle(block, recordMap)

      const slug = toSlug(slugProp || title)
      const fullSlug = category ? `${toSlug(category)}/${slug}` : slug

      if (!slug || !fullSlug) return map

      if (map[fullSlug]) {
        console.warn('Duplicate canonical page id for slug', {
          fullSlug,
          pageId,
          existingPageId: map[fullSlug]
        })
        return map
      }

      return {
        ...map,
        [fullSlug]: pageId
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
