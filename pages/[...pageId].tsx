import { type GetServerSideProps } from 'next'
import { NotionPage } from '@/components/NotionPage'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { getSiteMap } from '@/lib/get-site-map'
import { getPageProperty, getBlockTitle } from 'notion-utils'
import { domain } from '@/lib/config'
import { type PageProps } from '@/lib/types'

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const pathParts = context.params?.pageId
  const requestedPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts

  try {
    const siteMap = await getSiteMap()

    for (const [pageIdKey, recordMap] of Object.entries(siteMap.pageMap)) {
      if (!recordMap || !recordMap.block || !pageIdKey) continue

      const block = recordMap.block[pageIdKey]?.value
      if (!block) continue

      const slug = getPageProperty<string>('Slug', block, recordMap)?.trim()
      const category = getPageProperty<string>('Category', block, recordMap)?.trim()
      const title = getBlockTitle(block, recordMap)?.trim()

      const fallbackSlug = slug || title
      const fullSlug = category ? `${category}/${fallbackSlug}` : fallbackSlug

      if (fullSlug && fullSlug === requestedPath) {
        const props = await resolveNotionPage(domain, pageIdKey)
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
  const pageId = props.pageId
  const recordMap = props.recordMap

  const block =
    pageId && recordMap?.block?.[pageId]
      ? recordMap.block[pageId].value
      : null

  const getProp = (name: string) =>
    block && recordMap ? getPageProperty<string>(name, block, recordMap) : null

  const category = getProp('Category')
  const slug = getProp('Slug')

  return <NotionPage {...props} />
}
