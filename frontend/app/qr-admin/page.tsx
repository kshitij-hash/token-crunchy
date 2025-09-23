import React from 'react'
import QRCodeManager from '../../components/admin/QRCodeManager'

export default function QRAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 QR Code Manager
          </h1>
          <p className="text-gray-600">
            Manage and download QR codes for your Token Crunchies game
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <QRCodeManager />
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            📋 Quick Actions
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Generate QR Data:</strong> <code className="bg-blue-100 px-1 rounded">npm run qr:generate</code></p>
            <p>• <strong>Generate QR Images:</strong> <code className="bg-blue-100 px-1 rounded">npm run qr:images</code></p>
            <p>• <strong>Reset Database:</strong> <code className="bg-blue-100 px-1 rounded">npm run db:reset</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
