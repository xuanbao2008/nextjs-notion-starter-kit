import { type GetServerSideProps } from 'next'
import { NotionPage } from '@/components/NotionPage'
import { Breadcrumb } from '@/components/Breadcrumb'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getSiteMap } from '@/lib/get-site-map'
import { getPageProperty, getBlockTitle } from 'notion-utils'
import { domain } from '@/lib/config'
import { type PageProps } from '@/lib/types'

// Utility to normalize values into slug-safe strings
const toSlug = (s?: string | null) =>
  s?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') ?? ''

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const pathParts = context.params?.pageId
  const requestedPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts

  try {
    const siteMap = await getSiteMap()

    for (const [pageId, recordMap] of Object.entries(siteMap.pageMap)) {
      if (!recordMap) continue
    
      const block = recordMap.block?.[pageId]?.value
      if (!block) continue
    
      const slug = getPageProperty<string>('Slug', block, recordMap)?.trim()
      const category = getPageProperty<string>('Category', block, recordMap)?.trim()
      const title = getBlockTitle(block, recordMap)
    
      const path = slug || title
      const fullSlug = category ? `${category}/${path}` : path
    
      if (fullSlug && fullSlug === requestedPath) {
        const props = await resolveNotionPage(domain, pageId)
        return { props }
      }
    }    

    return { notFound: true }
  } catch (err) {
    console.error('Page error:', domain, requestedPath, err)
    return { notFound: true }
  }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  const block = props?.recordMap?.block?.[props.pageId]?.value
  const recordMap = props?.recordMap

  const getProp = (name: string) =>
    block?.properties?.[name]?.[0]?.[0] || null

  const slug = getProp('Slug') ?? getBlockTitle(block, recordMap)
  const category = getProp('Category')
  const locale = getProp('Locale')
  const year = getProp('Year')

  const clean = (s: string | null) =>
    s?.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') ?? ''

  const path = [locale, year, category, slug].filter(Boolean).map(clean).join('/')

  return (
    <>
      <Breadcrumb path={path} />
      <NotionPage {...props} />
    </>
  )
}
