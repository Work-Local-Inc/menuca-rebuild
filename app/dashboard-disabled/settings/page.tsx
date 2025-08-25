import React, { Suspense } from 'react'
import SettingsClient from './SettingsClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="p-6">
        <SettingsClient />
      </div>
    </Suspense>
  )
}


