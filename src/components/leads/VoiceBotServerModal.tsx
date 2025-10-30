'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Server, Globe } from 'lucide-react'

interface VoiceBotServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectServer: (server: 'india' | 'us') => void
  leadName?: string
}

export function VoiceBotServerModal({
  isOpen,
  onClose,
  onSelectServer,
  leadName
}: VoiceBotServerModalProps) {
  const [selectedServer, setSelectedServer] = useState<'india' | 'us'>('india')

  const handleSubmit = () => {
    onSelectServer(selectedServer)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-600" />
          Select Voice Bot Server
        </div>
      }
    >
      <div className="p-6">
        <div className="space-y-4">
          {leadName && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Scheduling call for: <span className="font-medium text-gray-900">{leadName}</span>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Choose Server Location:
            </label>

            {/* India Server Option */}
            <div
              onClick={() => setSelectedServer('india')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedServer === 'india'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedServer === 'india'
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedServer === 'india' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <Globe className={`h-5 w-5 ${selectedServer === 'india' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div>
                  <p className={`font-medium ${selectedServer === 'india' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Internal (India Server)
                  </p>
                  <p className="text-xs text-gray-500">Best for Asia-Pacific region</p>
                </div>
              </div>
            </div>

            {/* US Server Option */}
            <div
              onClick={() => setSelectedServer('us')}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedServer === 'us'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedServer === 'us'
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedServer === 'us' && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <Globe className={`h-5 w-5 ${selectedServer === 'us' ? 'text-blue-600' : 'text-gray-500'}`} />
                <div>
                  <p className={`font-medium ${selectedServer === 'us' ? 'text-blue-900' : 'text-gray-900'}`}>
                    Internal (US Server)
                  </p>
                  <p className="text-xs text-gray-500">Best for Americas & Europe</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="flex-1"
            >
              Schedule Call
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
