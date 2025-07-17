'use client'

import cs from 'classnames'
import dynamic from 'next/dynamic'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getBlockTitle, getPageProperty, parsePageId } from 'notion-utils'
import * as React from 'react'
import BodyClassName from 'react-body-classname'
import { NotionRenderer, useNotionContext } from 'react-notion-x'
import { useSearchParam } from 'react-use'

import { Breadcrumb } from './Breadcrumb'
import { Footer } from './Footer'
import { Loading } from './Loading'
import { NotionPageHeader } from './NotionPageHeader'
import { Page404 } from './Page404'
import { PageAside } from './PageAside'
import { PageHead } from './PageHead'
import { mapImageUrl } from '@/lib/map-image-url'
import { getCanonicalPageUrl, mapPageUrl } from '@/lib/map-page-url'
import { searchNotion } from '@/lib/search-notion'
import { useDarkMode } from '@/lib/use-dark-mode'
import * as config from '@/lib/config'
import type * as types from '@/lib/types'

const Code = dynamic(() =>
  import('react-notion-x/build/third-party/code').then(async (m) => {
    await Promise.allSettled([
      import('prismjs/components/prism-bash.js'),
      import('prismjs/components/prism-js-templates.js'),
      import('prismjs/components/prism-typescript.js'),
      import('prismjs/components/prism-json.js')
    ])
    return m.Code
  })
)

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection)
)

const Modal = dynamic(() =>
  import('react-notion-x/build/third-party/modal').then((m) => {
    m.Modal.setAppElement('.notion-viewport')
    return m.Modal
  }), { ssr: false }
)

export function NotionPage(props: types.PageProps) {
  const { site, recordMap, pageId, error } = props

  const router = useRouter()
  const lite = useSearchParam('lite')
  const isLiteMode = lite === 'true'
  const { isDarkMode } = useDarkMode()

  if (router.isFallback) return <Loading />
  if (error || !site || !recordMap || !pageId) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const keys = Object.keys(recordMap.block || {})
  const block = recordMap.block?.[keys[0] || '']?.value
  if (!block) return <Page404 site={site} pageId={pageId} error={error} />

  const getProp = (name: string) =>
    getPageProperty<string>(name, block, recordMap) || ''

  const category = getProp('Category')?.trim().toLowerCase().replace(/\s+/g, '-')
  const slug = getProp('Slug')?.trim().toLowerCase().replace(/\s+/g, '-') || 
               getProp('title')?.trim().toLowerCase().replace(/\s+/g, '-')

  const breadcrumbs = []
  if (category) breadcrumbs.push({ name: category, path: `/${category}` })
  breadcrumbs.push({
    name: slug,
    path: category ? `/${category}/${slug}` : `/${slug}`
  })

  const name = getBlockTitle(block, recordMap) || site.name
  const title = props.tagsPage && props.propertyToFilterName ? `${props.propertyToFilterName} ${name}` : name

  const canonicalPageUrl = config.isDev
    ? undefined
    : getCanonicalPageUrl(site, props.recordMap)(pageId)

    
  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
    block?.format?.page_cover ||
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

      {breadcrumbs.length > 0 && (
        <Breadcrumb
          path={breadcrumbs.map((b) => b.path)}
          segments={breadcrumbs.map((b) => b.name)}
        />
      )}

      {isLiteMode && <BodyClassName className='notion-lite' />}
      {isDarkMode && <BodyClassName className='dark-mode' />}

      <NotionRenderer
        bodyClassName={cs('notion', pageId === site.rootNotionPageId && 'index-page')}
        darkMode={isDarkMode}
        components={{
          nextImage: Image,
          nextLink: Link,
          Code,
          Collection,
          Modal,
          Header: NotionPageHeader
        }}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        rootDomain={site.domain}
        fullPage={!isLiteMode}
        previewImages={!!recordMap.preview_images}
        showCollectionViewDropdown={false}
        showTableOfContents
        mapPageUrl={mapPageUrl(site, recordMap)}
        mapImageUrl={mapImageUrl}
        searchNotion={config.isSearchEnabled ? searchNotion : undefined}
        pageAside={<PageAside block={block} recordMap={recordMap} isBlogPost />}
        footer={<Footer />}
        pageTitle={title}
      />
    </>
  )
}
