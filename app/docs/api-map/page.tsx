"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { ApiMap } from '@/config/api-map'

type Row = { name: string; method: string; path: string; status?: number }

export default function ApiMapPage() {
  const [base, setBase] = useState('')
  const [rows, setRows] = useState<Row[]>([])

  const flat = useMemo(() => {
    const list: Row[] = []
    const push = (name: string, method: string, path: string) => list.push({ name, method, path })

    // settings
    push('settings.get', 'GET', ApiMap.settings.get)
    push('settings.save', 'PUT', ApiMap.settings.save)

    // tablet
    push('tablet.accept', 'POST', ApiMap.tablet.accept)
    push('tablet.reject', 'POST', ApiMap.tablet.reject)
    push('tablet.getOrder', 'GET', ApiMap.tablet.getOrder)
    push('tablet.addOrder', 'POST', ApiMap.tablet.addOrder)
    push('tablet.test', 'GET', ApiMap.tablet.test)

    // orders
    push('orders.complete', 'POST', ApiMap.orders.complete)

    // payments
    push('payments.createIntent', 'POST', ApiMap.payments.createIntent)
    push('payments.createTest', 'POST', ApiMap.payments.createTest)
    push('payments.stripeWebhook', 'POST', ApiMap.payments.stripeWebhook)

    // address
    push('address.suggest', 'GET', ApiMap.address.suggest)

    // auth
    push('auth.login', 'POST', ApiMap.auth.login)
    push('auth.logout', 'POST', ApiMap.auth.logout)
    push('auth.me', 'GET', ApiMap.auth.me)

    // printer
    push('printer.queue', 'POST', ApiMap.printer.queue)
    push('printer.testQueue', 'POST', ApiMap.printer.testQueue)
    push('printer.sharedQueue', 'POST', ApiMap.printer.sharedQueue)
    push('printer.cloudBridge', 'POST', ApiMap.printer.cloudBridge)

    // menu management
    push('menuManagement.restaurant', 'GET', ApiMap.menuManagement.restaurant(':restaurantId'))
    push('menuManagement.menus', 'GET', ApiMap.menuManagement.menus(':restaurantId'))

    // admin
    push('admin.seedXtreme', 'POST', ApiMap.admin.seedXtreme)

    // app health
    push('env.health', 'GET', '/api/env-health')

    return list
  }, [])

  useEffect(() => {
    setRows(flat)
  }, [flat])

  const ping = async () => {
    const origin = base || window.location.origin
    const results: Row[] = []
    for (const r of rows) {
      const url = r.path.startsWith('http') ? r.path : origin + r.path
      try {
        const res = await fetch(url, { method: r.method === 'GET' ? 'GET' : 'OPTIONS', redirect: 'manual' })
        results.push({ ...r, status: res.status })
      } catch {
        results.push({ ...r, status: -1 })
      }
    }
    setRows(results)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Map</h1>
      <div className="flex gap-2 items-center mb-4">
        <input className="border px-3 py-2 rounded w-[480px]" placeholder="Base URL (optional)" value={base} onChange={e=>setBase(e.target.value)} />
        <button onClick={ping} className="px-4 py-2 bg-blue-600 text-white rounded">Ping All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">Name</th>
              <th className="p-2">Method</th>
              <th className="p-2">Path</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-mono">{r.name}</td>
                <td className="p-2">{r.method}</td>
                <td className="p-2 font-mono">{r.path}</td>
                <td className="p-2">{r.status ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


