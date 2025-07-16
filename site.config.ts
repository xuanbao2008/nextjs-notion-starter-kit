import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '23225e30af1080d89571c38086a80693',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: 'ea14b41c-eb0b-419d-86d1-3dbda704ff06',

  // basic site info (required)
  name: 'iine',
  domain: 'iine.jp',
  author: 'Bao Doan',

  // open graph metadata (optional)
  description: 'Japan life blog - iine tip',

  // social usernames (optional)
  twitter: 'doanxuanbaoz',
  // github: 'xuanbao2008',
  linkedin: 'doanxuanbao',
  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: 'https://pbs.twimg.com/profile_images/1529905032615071744/pftlWiSU_400x400.jpg',
  defaultPageCover: 'https://www.notion.so/images/page-cover/woodcuts_3.jpg',
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: true,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  pageUrlOverrides: null,

  pageUrlAdditions: {
    '/event': '23225e30af1080f499ecf1f45803fe1e',
    '/about': '9c131551696645d681f44d97b2334924',
    '/contact': '23225e30af1080b79294d8afa85b9b73'
  },

  // whether to use the default notion navigation style or a custom one with links to
  // important pages
  navigationStyle: 'custom',
  navigationLinks: [
    {
      title: 'About',
      pageId: '9c131551696645d681f44d97b2334924'
    },
    {
      title: 'Contact',
      pageId: '23225e30af1080b79294d8afa85b9b73'
    }
  ]
})
