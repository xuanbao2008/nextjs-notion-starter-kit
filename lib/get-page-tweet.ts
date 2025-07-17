import { getPageProperty } from 'notion-utils'
import type { Block } from 'notion-types'
import type { ExtendedRecordMap } from './types'

export function getPageTweet(
  block: Block,
  recordMap: ExtendedRecordMap
): string | null {
  return getPageProperty('Tweet', block, recordMap)
}
