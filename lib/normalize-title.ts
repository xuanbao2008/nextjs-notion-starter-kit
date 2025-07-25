export const normalizeTitle = (title?: string | null): string => {
  const input = (title || '').toLowerCase()

  return input
    // Remove Vietnamese accents
    .replaceAll(/[áàảạãăắằẳẵặâấầẩẫậ]/g, 'a')
    .replaceAll(/[éèẻẽẹêếềểễệ]/g, 'e')
    .replaceAll(/[íìỉĩị]/g, 'i')
    .replaceAll(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
    .replaceAll(/[úùủũụưứừửữự]/g, 'u')
    .replaceAll(/[ýỳỷỹỵ]/g, 'y')
    .replaceAll('đ', 'd') // <- updated to string

    // Replace whitespace and symbols with hyphens
    .replaceAll(/[\s·/_,:;]+/g, '-')

    // Remove remaining non-word characters except hyphens
    .replaceAll(/[^a-z0-9-]/g, '')

    // Collapse multiple hyphens
    .replaceAll(/--+/g, '-')

    // Trim hyphens at start/end
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}
