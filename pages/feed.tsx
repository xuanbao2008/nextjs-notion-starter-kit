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
    const recordMap = siteMap.pageMap?.[pageId as string]
    const blockMap = recordMap?.block

    if (!blockMap || typeof blockMap !== 'object') continue

    const firstBlockId = Object.keys(blockMap)[0]
    if (!firstBlockId) continue
    const block = blockMap[firstBlockId]?.value
    if (!block) continue

    const parentPage = getBlockParentPage(block, recordMap)
    if (!parentPage) continue

    const title = getBlockTitle(block, recordMap)
    const url = `${host}/${path}`

    feed.item({
      title,
      description: title,
      guid: pageId,
      url,
      date: new Date(block.created_time)
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
