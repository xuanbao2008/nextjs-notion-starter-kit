import Link from 'next/link'

type Props = {
  path: string // e.g. "en/2025/blog/my-post"
}

export const Breadcrumb = ({ path }: Props) => {
  const segments = path.split('/').filter(Boolean)

  const buildHref = (index: number) =>
    '/' + segments.slice(0, index + 1).join('/')

  return (
    <nav aria-label="breadcrumb" className="text-sm mb-4">
      <ol className="flex flex-wrap items-center space-x-2 text-gray-600">
        <li>
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <span className="mx-1">/</span>
        </li>
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          const href = buildHref(idx)
          const label = decodeURIComponent(seg).replace(/-/g, ' ')

          return (
            <li key={idx} className="inline-flex items-center">
              {isLast ? (
                <span className="text-gray-800 font-medium">{label}</span>
              ) : (
                <>
                  <Link href={href} className="text-blue-600 hover:underline">
                    {label}
                  </Link>
                  <span className="mx-1">/</span>
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
