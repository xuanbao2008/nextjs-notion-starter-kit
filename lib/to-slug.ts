/**
 * Convert a string into a URL-friendly slug.
 * Lowercase, trim, remove special characters, replace spaces with dashes.
 */
export function toSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Collapse multiple dashes
  }
  