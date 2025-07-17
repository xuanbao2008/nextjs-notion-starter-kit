import cs from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { type PageBlock } from 'notion-types'
import {
  formatDate,
  getBlockTitle,
  getPageProperty,
  parsePageId
} from 'notion-utils'
import * as React from 'react'
import BodyClassName from 'react-body-classname'
import {
  type NotionComponents,
  NotionRenderer,
  useNotionContext
} from 'react-notion-x'
import { EmbeddedTweet, TweetNotFound, TweetSkeleton } from 'react-tweet'
import { useSearchParam } from 'react-use'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'

import { Breadcrumb } from './Breadcrumb'
import { Footer } from './Footer'
import { Loading } from './Loading'
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
import styles from './styles.module.css'

// Dynamic Imports
const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    await Promise.allSettled([
      import('prismjs/components/prism-js-templates'),
      import('prismjs/components/prism-bash'),
      import('prismjs/components/prism-typescript'),
      import('prismjs/components/prism-json')
    ])
    return m.Code
  })
)

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection)
)

const Modal = dynamic(
  () =>
    import('react-notion-x/build/third-party/modal').then((m) => {
      m.Modal.setAppElement('.notion-viewport')
      return m.Modal
    }),
  { ssr: false }
)

const HeroHeader = dynamic<{ className?: string }>(
  () => import('./HeroHeader').then((m) => m.HeroHeader),
  { ssr: false }
)

const Tweet = ({ id }: { id: string }) => {
  const { recordMap } = useNotionContext()
  const tweet = (recordMap as types.ExtendedTweetRecordMap)?.tweets?.[id]

  return (
    <React.Suspense fallback={<TweetSkeleton />}>
      {tweet ? <EmbeddedTweet tweet={tweet} /> : <TweetNotFound />}
    </React.Suspense>
  )
}

// Custom Property Display Hooks
const propertyLastEditedTimeValue = ({ block, pageHeader }: any, defaultFn: () => React.ReactNode) => {
  if (pageHeader && block?.last_edited_time) {
    return `Last updated ${formatDate(block?.last_edited_time, { month: 'long' })}`
  }
  return defaultFn()
}

const propertyDateValue = ({ data, schema, pageHeader }: any, defaultFn: () => React.ReactNode) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'published') {
    const publishDate = data?.[0]?.[1]?.[0]?.[1]?.start_date
    if (publishDate) {
      return `${formatDate(publishDate, { month: 'long' })}`
    }
  }
  return defaultFn()
}

const propertyTextValue = ({ schema, pageHeader }: any, defaultFn: () => React.ReactNode) => {
  if (pageHeader && schema?.name?.toLowerCase() === 'author') {
    return <b>{defaultFn()}</b>
  }
  return defaultFn()
}

// -----------------------------------------------------------------------------
// Main NotionPage Component
// -----------------------------------------------------------------------------

export function NotionPage({
  site,
  breadcrumbs = [],
  recordMap,
  error,
  pageId,
  tagsPage,
  propertyToFilterName
}: types.PageProps & { breadcrumbs?: { name: string; path: string }[] }) {
  const router = useRouter()
  const lite = useSearchParam('lite')
  const isLiteMode = lite === 'true'
  const { isDarkMode } = useDarkMode()

  const components = React.useMemo<Partial<NotionComponents>>(
    () => ({
      nextLegacyImage: Image,
      nextLink: Link,
      Code,
      Collection,
      Modal,
      Tweet,
      Header: NotionPageHeader,
      propertyLastEditedTimeValue,
      propertyTextValue,
      propertyDateValue
    }),
    []
  )

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite

    const searchParams = new URLSearchParams(params)
    return site ? mapPageUrl(site, recordMap!, searchParams) : undefined
  }, [site, recordMap, lite])

  const keys = Object.keys(recordMap?.block || {})
  const block = recordMap?.block?.[keys[0]!]?.value
  const isBlogPost = block?.type === 'page' && block?.parent_table === 'collection'
  const isBioPage = parsePageId(block?.id) === parsePageId('8d0062776d0c4afca96eb1ace93a7538')

  const pageAside = React.useMemo(() => {
    return <PageAside block={block!} recordMap={recordMap!} isBlogPost={isBlogPost} />
  }, [block, recordMap, isBlogPost])

  const pageCover = isBioPage ? (
    <HeroHeader className='notion-page-cover-wrapper notion-page-cover-hero' />
  ) : null

  if (router.isFallback) return <Loading />
  if (error || !site || !block) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const name = getBlockTitle(block, recordMap) || site.name
  const title = tagsPage && propertyToFilterName ? `${propertyToFilterName} ${name}` : name

  if (!config.isServer) {
    const g = window as any
    g.pageId = pageId
    g.recordMap = recordMap
    g.block = block
  }

  const canonicalPageUrl = config.isDev ? undefined : getCanonicalPageUrl(site, recordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
      (block as PageBlock).format?.page_cover ||
      config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, recordMap) || config.description

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
      />

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {isDarkMode && <BodyClassName className='dark-mode' />}

      {breadcrumbs.length > 0 && <Breadcrumb path={breadcrumbs.map((b) => b.path)} />}

      <NotionRenderer
        bodyClassName={cs(
          styles.notion,
          pageId === site.rootNotionPageId && 'index-page',
          tagsPage && 'tags-page'
        )}
        darkMode={isDarkMode}
        components={components}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        rootDomain={site.domain}
        fullPage={!isLiteMode}
        previewImages={!!recordMap?.preview_images}
        showCollectionViewDropdown={false}
        showTableOfContents={!!isBlogPost}
        minTableOfContentsItems={3}
        defaultPageIcon={config.defaultPageIcon}
        defaultPageCover={config.defaultPageCover}
        defaultPageCoverPosition={config.defaultPageCoverPosition}
        linkTableTitleProperties={false}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapImageUrl}
        searchNotion={config.isSearchEnabled ? searchNotion : undefined}
        pageAside={pageAside}
        footer={<Footer />}
        pageTitle={tagsPage && propertyToFilterName ? title : undefined}
        pageCover={pageCover}
      />
    </>
  )
}
