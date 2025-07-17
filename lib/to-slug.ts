export function toSlug(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/--+/g, '-')
}
