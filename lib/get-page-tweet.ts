import { getPageProperty } from 'notion-utils'
import type { Block, ExtendedRecordMap } from 'notion-types'

export function getPageTweet(
  block: Block,
  recordMap: ExtendedRecordMap
): string | null {
  return getPageProperty('Tweet', block, recordMap)
}
