import Link from 'next/link'

interface Props {
  segments: string[]
}

const Breadcrumb = ({ segments }: Props) => {
  if (!segments?.length) return null

  const path = segments.map((_, idx) => '/' + segments.slice(0, idx + 1).join('/'))

  return (
    <nav aria-label="Breadcrumb" className="my-4">
      <ol className="flex flex-wrap items-center text-sm text-gray-500">
        {segments.map((segment, idx) => (
          <li key={idx} className="flex items-center">
            <Link
              href={path[idx]}
              className="text-blue-600 hover:underline capitalize"
            >
              {segment.replaceAll('-', ' ')}
            </Link>
            {idx < segments.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
