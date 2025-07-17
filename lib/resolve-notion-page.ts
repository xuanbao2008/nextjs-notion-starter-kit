import { type ExtendedRecordMap } from 'notion-types'
import type { PageProps } from './types'
import * as acl from './acl'
import { environment, site } from './config'
import { db } from './db'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'

export async function resolveNotionPage(
  domain: string,
  rawPageId?: string
): Promise<PageProps> {
  if (!rawPageId || rawPageId === 'index') {
    const recordMap = await getPage(site.rootNotionPageId)
    const props: PageProps = { site, recordMap, pageId: site.rootNotionPageId }
    return { ...props, ...(await acl.pageAcl(props)) }
  }

  const useUriToPageIdCache = true
  const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
  const cacheTTL = undefined

  let pageId: string | undefined

  if (useUriToPageIdCache) {
    try {
      pageId = await db.get(cacheKey)
    } catch (err: any) {
      console.warn(`redis error get "${cacheKey}"`, err.message)
    }
  }

  if (!pageId) {
    const siteMap = await getSiteMap()
    pageId = siteMap.canonicalPageMap[rawPageId]

    if (!pageId) {
      return {
        error: {
          message: `Not found "${rawPageId}"`,
          statusCode: 404
        }
      }
    }

    if (useUriToPageIdCache) {
      try {
        await db.set(cacheKey, pageId, cacheTTL)
      } catch (err: any) {
        console.warn(`redis error set "${cacheKey}"`, err.message)
      }
    }
  }

  const recordMap = await getPage(pageId)
  const props: PageProps = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}
