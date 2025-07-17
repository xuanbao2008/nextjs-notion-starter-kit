import Link from 'next/link'
import React from 'react'

interface BreadcrumbProps {
  path: string[]
  segments: string[]
}

export function Breadcrumb({ segments, path }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center space-x-1 text-gray-600">
        {segments.map((segment, idx) => (
          <li key={idx} className="flex items-center">
            <Link
              href={path[idx] ?? '#'}
              prefetch={false}
              className="text-blue-600 hover:underline capitalize"
            >
              {segment?.replaceAll?.('-', ' ') ?? ''}
            </Link>
            {idx < segments.length - 1 && (
              <span className="mx-2 text-gray-400">/</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
