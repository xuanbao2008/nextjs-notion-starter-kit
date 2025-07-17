import { type GetServerSideProps } from 'next'
import { getPageProperty } from 'notion-utils'

import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { toSlug } from '@/lib/to-slug'
import { type PageProps } from '@/lib/types'

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const pathParts = context.params?.pageId
  const requestedPath = Array.isArray(pathParts) ? pathParts.join('/') : pathParts

  try {
    const siteMap = await getSiteMap()

    for (const [pageId, recordMap] of Object.entries(siteMap.pageMap ?? {})) {
      const block = recordMap?.block?.[pageId]?.value
      if (!block) continue

      const slugProp = getPageProperty<string>('Slug', block, recordMap)
      const title = getPageProperty<string>('title', block, recordMap)
      const categoryProp = getPageProperty<string>('Category', block, recordMap)

      const slug = toSlug(slugProp || title)
      const category = toSlug(categoryProp || '')

      // Handles paths like 'category/slug' or just 'slug'
      const fullSlug = category ? `${category}/${slug}` : slug

      if (fullSlug === requestedPath) {
        const props = await resolveNotionPage(domain, pageId)

        const breadcrumbs = []
        if (category) breadcrumbs.push({ name: category, path: `/${category}` })
        if (slug) breadcrumbs.push({ name: slug, path: category ? `/${category}/${slug}` : `/${slug}` })

        return { props: { ...props, breadcrumbs } }
      }
    }

    return { notFound: true }
  } catch (err) {
    console.error('Page error:', domain, requestedPath, err)
    return { notFound: true }
  }
}

export default function NotionDomainDynamicPage(props: PageProps) {
  return <NotionPage {...props} />
}
