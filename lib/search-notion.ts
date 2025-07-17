import pMemoize from 'p-memoize'
import ExpiryMap from 'expiry-map'
import { api } from './config'
import type { SearchParams, SearchResults } from 'notion-types'

export const searchNotion = pMemoize(searchNotionImpl, {
  cacheKey: (args) => args[0]?.query,
  cache: new ExpiryMap(10_000)
})

async function searchNotionImpl(
  params: SearchParams
): Promise<SearchResults> {
  return fetch(api.searchNotion, {
    method: 'POST',
    body: JSON.stringify(params),
    headers: {
      'content-type': 'application/json'
    }
  })
    .then((res) => {
      if (res.ok) {
        return res
      }

      // convert non-2xx HTTP responses into errors
      const error: any = new Error(res.statusText)
      error.response = res
      throw error
    })
    .then((res) => res.json() as Promise<SearchResults>)

  // return ky
  //   .post(api.searchNotion, {
  //     json: params
  //   })
  //   .json()
}
