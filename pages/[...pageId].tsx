import { type GetStaticPaths, type GetStaticProps } from 'next'
import { type ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { getBlockTitle } from '@/lib/get-block-title'
import { getPageProperty } from '@/lib/get-page-property'
import { getSiteMap } from '@/lib/get-site-map'
import { normalizeTitle } from '@/lib/normalize-title'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps } from '@/lib/types'

export const getStaticPaths: GetStaticPaths = async () => {
  const siteMap = await getSiteMap()
  const pageMap = siteMap.pageMap as Record<string, ExtendedRecordMap>
  const paths: { params: { pageId: string[] } }[] = []

  for (const [pageId, recordMap] of Object.entries(pageMap)) {
    const block = recordMap.block?.[pageId]?.value
    if (!block) continue

    const slug = normalizeTitle(
      (getPageProperty('slug', block, recordMap) as string | null) ||
      getBlockTitle(block, recordMap)
    )

    const category = normalizeTitle(getPageProperty('Category', block, recordMap) || '')
    const locale = normalizeTitle(getPageProperty('Locale', block, recordMap) || '')

    const segments = [locale, category, slug].filter(Boolean)
    if (segments.length === 0) continue

    paths.push({ params: { pageId: segments } })
  }

  return {
    paths,
    fallback: false // no ISR fallback; all pages must be generated at build time
  }
}

export const getStaticProps: GetStaticProps<PageProps> = async (context) => {
  const pathParts = Array.isArray(context.params?.pageId)
    ? context.params.pageId
    : [context.params?.pageId || '']

  const slug = normalizeTitle(pathParts.at(-1))
  const maybeCategory = pathParts.length >= 2 ? normalizeTitle(pathParts.at(-2)) : null
  const maybeLocale = pathParts.length >= 3 ? normalizeTitle(pathParts.at(-3)) : null

  const siteMap = await getSiteMap()
  const pageMap = siteMap.pageMap as Record<string, ExtendedRecordMap>

  for (const [pageId, recordMap] of Object.entries(pageMap)) {
    const block = recordMap.block?.[pageId]?.value
    if (!block) continue

    const pageSlug = normalizeTitle(
      (getPageProperty('slug', block, recordMap) as string | null) ||
      getBlockTitle(block, recordMap)
    )

    if (pageSlug !== slug) continue

    const category = normalizeTitle(getPageProperty('Category', block, recordMap) || '')
    const locale = normalizeTitle(getPageProperty('Locale', block, recordMap) || '')

    if (category && maybeCategory && category !== maybeCategory) continue
    if (locale && maybeLocale && locale !== maybeLocale) continue

    try {
      const props = await resolveNotionPage(domain, pageId)
      return { props }
    } catch (err) {
      console.error('Failed to resolve Notion page', pageId, err)
      return { notFound: true }
    }
  }

  return { notFound: true }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}
