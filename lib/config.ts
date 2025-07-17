/**
 * Site-wide app configuration.
 */
import { parsePageId } from 'notion-utils'
import { type PostHogConfig } from 'posthog-js'
import {
  type PageUrlOverridesInverseMap,
  type PageUrlOverridesMap,
  type Site
} from './types'


import {
  getEnv,
  getRequiredSiteConfig,
  getSiteConfig
} from './get-config-value'
import { type NavigationLink } from './site-config'
import {
  type NavigationStyle,
  type PageUrlOverridesInverseMap,
  type PageUrlOverridesMap,
  type Site
} from './types'

// Root Notion page setup
export const rootNotionPageId: string = parsePageId(
  getSiteConfig('rootNotionPageId'),
  { uuid: false }
)!

if (!rootNotionPageId) {
  throw new Error('Config error: invalid "rootNotionPageId"')
}

// Optional: lock to one Notion workspace
export const rootNotionSpaceId: string | null =
  parsePageId(getSiteConfig('rootNotionSpaceId'), { uuid: true }) ?? null

// --- OVERRIDES DISABLED: Slug/Category logic is used instead
export const pageUrlOverrides = {}
export const pageUrlAdditions = {}

export const inversePageUrlOverrides: PageUrlOverridesInverseMap = {}

// Env and site basics
export const environment = process.env.NODE_ENV || 'development'
export const isDev = environment === 'development'

export const name: string = getRequiredSiteConfig('name')
export const author: string = getRequiredSiteConfig('author')
export const domain: string = getRequiredSiteConfig('domain')
export const description: string = getSiteConfig('description', 'Notion Blog')
export const language: string = getSiteConfig('language', 'en')

// Social links
export const twitter: string | undefined = getSiteConfig('twitter')
export const mastodon: string | undefined = getSiteConfig('mastodon')
export const github: string | undefined = getSiteConfig('github')
export const youtube: string | undefined = getSiteConfig('youtube')
export const linkedin: string | undefined = getSiteConfig('linkedin')
export const newsletter: string | undefined = getSiteConfig('newsletter')
export const zhihu: string | undefined = getSiteConfig('zhihu')

export const getMastodonHandle = (): string | undefined => {
  if (!mastodon) return
  const url = new URL(mastodon)
  return `${url.pathname.slice(1)}@${url.hostname}`
}

// Default Notion styles
export const defaultPageIcon: string | undefined =
  getSiteConfig('defaultPageIcon')
export const defaultPageCover: string | undefined =
  getSiteConfig('defaultPageCover')
export const defaultPageCoverPosition: number = getSiteConfig(
  'defaultPageCoverPosition',
  0.5
)

// Image preview / LQIP
export const isPreviewImageSupportEnabled: boolean = getSiteConfig(
  'isPreviewImageSupportEnabled',
  false
)

// Slug-based URLs (no Notion IDs in URLs)
export const includeNotionIdInUrls: boolean = getSiteConfig(
  'includeNotionIdInUrls',
  !!isDev
)

// Navigation
export const navigationStyle: NavigationStyle = getSiteConfig(
  'navigationStyle',
  'default'
)
export const navigationLinks: Array<NavigationLink | undefined> = getSiteConfig(
  'navigationLinks',
  null
)

// Site search
export const isSearchEnabled: boolean = getSiteConfig('isSearchEnabled', true)

// Redis (optional)
export const isRedisEnabled: boolean =
  getSiteConfig('isRedisEnabled', false) || !!getEnv('REDIS_ENABLED', null)

export const redisHost = getEnv('REDIS_HOST', isRedisEnabled ? undefined : null)
export const redisPassword = getEnv(
  'REDIS_PASSWORD',
  isRedisEnabled ? undefined : null
)
export const redisUser: string = getEnv('REDIS_USER', 'default')
export const redisUrl = getEnv(
  'REDIS_URL',
  isRedisEnabled ? `redis://${redisUser}:${redisPassword}@${redisHost}` : null
)
export const redisNamespace = getEnv('REDIS_NAMESPACE', 'preview-images')

// Runtime environment flags
export const isServer = typeof window === 'undefined'

export const port = getEnv('PORT', '3000')
export const host = isDev ? `http://localhost:${port}` : `https://${domain}`
export const apiHost = isDev
  ? host
  : `https://${process.env.VERCEL_URL || domain}`

export const apiBaseUrl = `/api`

export const api = {
  searchNotion: `${apiBaseUrl}/search-notion`,
  getNotionPageInfo: `${apiBaseUrl}/notion-page-info`,
  getSocialImage: `${apiBaseUrl}/social-image`
}

// Core site descriptor
export const site: Site = {
  domain,
  name,
  rootNotionPageId,
  rootNotionSpaceId,
  description
}

// Analytics
export const fathomId = isDev ? undefined : process.env.NEXT_PUBLIC_FATHOM_ID
export const fathomConfig = fathomId
  ? { excludedDomains: ['localhost', 'localhost:3000'] }
  : undefined

export const posthogId = process.env.NEXT_PUBLIC_POSTHOG_ID
export const posthogConfig: Partial<PostHogConfig> = {
  api_host: 'https://app.posthog.com'
}
