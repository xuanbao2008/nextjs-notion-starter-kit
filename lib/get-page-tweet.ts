import type { Block, ExtendedRecordMap } from 'notion-types'
import { getPageProperty } from 'notion-utils'

export function getPageTweet(
  block: Block,
  recordMap: ExtendedRecordMap
): string | null {
  return getPageProperty('Tweet', block, recordMap)
}
