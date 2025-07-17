import { getAllPagesInSpace, getBlockTitle, getPageProperty } from 'notion-utils'
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
  } as SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

const getPage = async (pageId: string, opts?: any) => {
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
) {
  const pageMap = await getAllPagesInSpace(
    rootNotionPageId,
    rootNotionSpaceId,
    getPage,
    {
      maxDepth
    }
  )

  const canonicalPageMap = Object.keys(pageMap).reduce((map, pageId) => {
    const recordMap = pageMap[pageId]
    const block = recordMap?.block?.[pageId]?.value
    if (!block) return map

    const slugProp = getPageProperty<string>('Slug', block, recordMap)
    const categoryProp = getPageProperty<string>('Category', block, recordMap)
    const title = getBlockTitle(block, recordMap)

    const slug = toSlug(slugProp || title)
    const category = toSlug(categoryProp)

    if (!slug) return map

    const fullSlug = category ? `${category}/${slug}` : slug

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
