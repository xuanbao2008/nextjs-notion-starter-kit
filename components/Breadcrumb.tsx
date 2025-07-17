import Link from 'next/link'
import React from 'react'

interface BreadcrumbProps {
  path: string[]
  segments: string[]
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, segments }) => {
  return (
    <nav aria-label="breadcrumb">
      <ol className="flex space-x-2 text-sm text-gray-600">
        {segments.map((segment, idx) => {
          const href = path[idx]
          if (!href) return null

          return (
            <li key={idx} className="flex items-center">
              <Link
                href={href}
                className="text-blue-600 hover:underline capitalize"
              >
                {segment.replaceAll('-', ' ')}
              </Link>
              {idx < segments.length - 1 && <span className="mx-2">/</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumb
