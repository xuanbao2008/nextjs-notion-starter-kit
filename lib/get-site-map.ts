import { getAllPagesInSpace, getBlockTitle, getPageProperty, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import * as config from './config'
import { toSlug } from './to-slug'
import { notion } from './notion-api'
import type { SiteMap } from './types'

export async function getSiteMap(): Promise<SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId ?? undefined
  )

  return {
    site: config.site,
    ...partialSiteMap
  }
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

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId?: string,
  {
    maxDepth = 1
  }: {
    maxDepth?: number
  } = {}
): Promise<Partial<SiteMap>> {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage,
    { maxDepth }
  )

  const canonicalPageMap = Object.entries(pageMap).reduce((map, [pageId, recordMap]) => {
    const block = recordMap?.block?.[pageId]?.value
    if (!block) return map

    const isPublic = getPageProperty<boolean | null>('Public', block, recordMap) ?? true
    if (!isPublic) return map

    const categoryProp = getPageProperty<string>('Category', block, recordMap)
    const slugProp = getPageProperty<string>('Slug', block, recordMap)
    const title = getBlockTitle(block, recordMap)

    const slug = toSlug(slugProp || title)
    if (!slug) return map

    const category = toSlug(categoryProp)
    const fullSlug = category ? `${category}/${slug}` : slug

    if (map[fullSlug]) {
      console.warn('Duplicate canonical slug detected:', {
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
  }, {} as Record<string, string>)

  return {
    pageMap,
    canonicalPageMap
  }
}
