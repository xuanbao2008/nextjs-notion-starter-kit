import { type GetServerSideProps } from 'next'
import { getPageProperty } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { toSlug } from '@/lib/to-slug'
import type { PageProps, Params } from '@/lib/types'

export const getServerSideProps: GetServerSideProps<PageProps, Params> = async (context) => {
  const pathParts = context.params?.pageId
  const requestedPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts

  try {
    const siteMap = await getSiteMap()

    for (const [pageId, recordMap] of Object.entries(siteMap.pageMap)) {
      const block = recordMap?.block?.[pageId]?.value
      if (!block) continue

      const _category = getPageProperty<string>('Category', block, recordMap)
      const _slug = getPageProperty<string>('Slug', block, recordMap)
      const title = getPageProperty<string>('title', block, recordMap)

      const slug = toSlug(_slug || title)
      const category = toSlug(_category)

      const fullPath = category ? `${category}/${slug}` : slug

      if (fullPath === requestedPath) {
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
  const block = props?.recordMap?.block?.[props.pageId ?? '']?.value
  const recordMap = props?.recordMap

  const getProp = (name: string) =>
    block && recordMap ? getPageProperty<string>(name, block, recordMap) : null

  const breadcrumbs = []
  const category = toSlug(getProp('Category'))
  const slug = toSlug(getProp('Slug') || getProp('title'))

  if (category) breadcrumbs.push({ name: category, path: `/${category}` })
  if (slug) breadcrumbs.push({ name: slug, path: `/${category}/${slug}` })

  return <NotionPage {...props} breadcrumbs={breadcrumbs} />
}
