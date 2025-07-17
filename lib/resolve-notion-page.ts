import { parsePageId } from 'notion-utils'

import * as acl from './acl'
import { db } from './db'
import { environment, pageUrlAdditions, pageUrlOverrides, site } from './config'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'
import type { PageProps } from './types'

export async function resolveNotionPage(
  domain: string,
  rawPageId?: string
): Promise<PageProps> {
  let pageId: string | undefined
  let recordMap

  if (rawPageId && rawPageId !== 'index') {
    const siteMap = await getSiteMap()
    pageId = siteMap?.canonicalPageMap[rawPageId]

    if (!pageId) {
      const override = pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId]
      if (override) pageId = parsePageId(override) ?? undefined
    }

    const useUriToPageIdCache = true
    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
    const cacheTTL = undefined

    if (!pageId && useUriToPageIdCache) {
      try {
        pageId = await db.get(cacheKey)
      } catch (err: any) {
        console.warn(`redis error get "${cacheKey}"`, err.message)
      }
    }

    if (pageId) {
      recordMap = await getPage(pageId)

      if (useUriToPageIdCache) {
        try {
          await db.set(cacheKey, pageId, cacheTTL)
        } catch (err: any) {
          console.warn(`redis error set "${cacheKey}"`, err.message)
        }
      }
    } else {
      return {
        error: {
          message: `Not found "${rawPageId}"`,
          statusCode: 404
        }
      }
    }
  } else {
    pageId = site.rootNotionPageId
    recordMap = await getPage(pageId)
  }

  const props: PageProps = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}
