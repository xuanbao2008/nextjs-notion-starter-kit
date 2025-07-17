import { type ParsedUrlQuery } from 'node:querystring'
import { type ExtendedRecordMap, type PageMap } from 'notion-types'

export * from 'notion-types'

export type NavigationStyle = 'default' | 'custom'

export type PageUrlOverridesMap = Record<string, string>
export type PageUrlOverridesInverseMap = Record<string, string>

export interface PageError {
  message?: string
  statusCode: number
}

export interface PageProps {
  site?: Site
  recordMap?: ExtendedRecordMap
  pageId?: string
  error?: PageError
  tagsPage?: boolean
  propertyToFilterName?: string | null
  breadcrumbs?: Array<{ name: string; path: string }>
}

export interface ExtendedTweetRecordMap extends ExtendedRecordMap {
  tweets: Record<string, any>
}

export interface Params extends ParsedUrlQuery {
  pageId: string
}

export interface Site {
  name: string
  domain: string
  rootNotionPageId: string
  rootNotionSpaceId: string | null
  html?: string
  fontFamily?: string
  darkMode?: boolean
  previewImages?: boolean
  description?: string
  image?: string
}

export interface SiteMap {
  site: Site
  pageMap: PageMap
  canonicalPageMap: CanonicalPageMap
}

export interface CanonicalPageMap {
  [canonicalPageId: string]: string
}

export interface NotionPageInfo {
  pageId: string
  title: string
  image?: string
  imageObjectPosition?: string
  author?: string
  authorImage?: string
  detail?: string
}
