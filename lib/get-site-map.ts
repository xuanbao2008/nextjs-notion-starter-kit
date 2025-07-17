import { getAllPagesInSpace, getPageProperty, getBlockTitle, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import * as config from './config'
import { toSlug } from './to-slug'
import { notion } from './notion-api'
import type { SiteMap, PageMap, CanonicalPageMap } from './types'

export async function getSiteMap(): Promise<SiteMap> {
  const { pageMap, canonicalPageMap } = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId ?? undefined
  )

  return {
    site: config.site,
    pageMap,
    canonicalPageMap
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
): Promise<{ pageMap: PageMap; canonicalPageMap: CanonicalPageMap }> {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage,
    {
      maxDepth
    }
  )

  const canonicalPageMap: CanonicalPageMap = {}

  for (const pageId of Object.keys(pageMap)) {
    const recordMap = pageMap[pageId]
    if (!recordMap) {
      throw new Error(`Error loading page "${pageId}"`)
    }

    const block = recordMap.block?.[pageId]?.value
    if (!block) continue

    const isPublic = getPageProperty<boolean | null>('Public', block, recordMap) ?? true
    if (!isPublic) continue

    const slugProp = getPageProperty<string>('Slug', block, recordMap)
    const category = getPageProperty<string>('Category', block, recordMap)
    const title = getBlockTitle(block, recordMap)

    const slug = toSlug(slugProp || title)
    if (!slug) continue

    const fullPath = category ? `${category}/${slug}` : slug

    if (canonicalPageMap[fullPath]) {
      console.warn('⚠ Duplicate slug detected:', { fullPath, pageId })
    }

    canonicalPageMap[fullPath] = pageId
  }

  return {
    pageMap,
    canonicalPageMap
  }
}
