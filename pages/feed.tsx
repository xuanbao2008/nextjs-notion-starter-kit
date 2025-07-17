import type { GetServerSideProps } from 'next'
import RSS from 'rss'
import {
  getBlockParentPage,
  getBlockTitle,
  getPageProperty,
  idToUuid
} from 'notion-utils'

import * as config from '@/lib/config'
import { getCanonicalPageUrl } from '@/lib/map-page-url'
import { getSiteMap } from '@/lib/get-site-map'
import { getSocialImageUrl } from '@/lib/get-social-image-url'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const siteMap = await getSiteMap()
  const ttlMinutes = 24 * 60
  const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed.xml`,
    language: config.language,
    ttl: ttlMinutes
  })

  for (const path of Object.keys(siteMap.canonicalPageMap)) {
    const pageId = siteMap.canonicalPageMap[path]
    if (!pageId) continue
  
    const recordMap = siteMap.pageMap[pageId]
    if (!recordMap) continue
  
    const blockKeys = Object.keys(recordMap.block || {})
    const firstKey = blockKeys[0]
    const block = firstKey ? recordMap.block[firstKey]?.value : null
    if (!block) continue
  
    const parentPage = getBlockParentPage(block, recordMap)
    const isBlogPost =
      block.type === 'page' &&
      block.parent_table === 'collection' &&
      parentPage?.id === idToUuid(config.rootNotionPageId)
  
    if (!isBlogPost) continue
  
    const title = getBlockTitle(block, recordMap) || config.name
    const description =
      getPageProperty<string>('Description', block, recordMap) || config.description
  
    const url = getCanonicalPageUrl(config.site, recordMap)(pageId)
    const lastUpdatedTime = getPageProperty<number>('Last Updated', block, recordMap)
    const publishedTime = getPageProperty<number>('Published', block, recordMap)
  
    const date = lastUpdatedTime
      ? new Date(lastUpdatedTime)
      : publishedTime
      ? new Date(publishedTime)
      : new Date()
  
    const socialImageUrl = getSocialImageUrl(pageId)
  
    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
            url: socialImageUrl,
            type: 'image/jpeg'
          }
        : undefined
    })
  }  

  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(feedText)
  res.end()

  return { props: {} }
}

export default function noop() {
  return null
}
