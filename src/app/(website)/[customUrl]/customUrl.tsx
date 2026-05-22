import React from 'react'
import ClientPublishedPage, { ClientPublishedPageProps } from '@/components/website/PageSections/ClientPublishedPage/ClientPublishedPage'

export default function customUrl({ customUrl, initialData }: ClientPublishedPageProps) {
  return (
    <div>
        <ClientPublishedPage customUrl={customUrl} initialData={initialData} />
    </div>
  )
}
    