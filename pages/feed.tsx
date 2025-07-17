import { type GetServerSideProps } from 'next'
import { getBlockParentPage, getBlockTitle } from 'notion-utils'
import RSS from 'rss'

import { host } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { type SiteMap } from '@/lib/types'

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteMap: SiteMap = await getSiteMap()

  const feed = new RSS({
    title: `RSS Feed - ${siteMap.site.name}`,
    site_url: `https://${siteMap.site.domain}`,
    feed_url: `${host}/feed`,
    pubDate: new Date()
  })

  for (const path of Object.keys(siteMap.canonicalPageMap)) {
    const pageId = siteMap.canonicalPageMap[path]
    const recordMap = siteMap.pageMap?.[pageId]
    if (!recordMap) continue

    const keys = Object.keys(recordMap.block || {})
    const block = keys.length > 0 ? recordMap.block?.[keys[0]]?.value : null
    if (!block) continue

    const parentPage = getBlockParentPage(block, recordMap)
    if (!parentPage) continue

    const title = getBlockTitle(block, recordMap)
    const url = `${host}/${path}`

    feed.item({
      title,
      guid: pageId,
      url,
      date: block.created_time
    })
  }

  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
  res.write(feed.xml({ indent: true }))
  res.end()

  return { props: {} }
}

export default function RSSFeed() {
  return null
}
