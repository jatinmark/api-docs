'use client'

export const dynamic = 'force-dynamic';

import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Check, Phone, Users, BarChart3, Copy } from 'lucide-react'
import { useState } from 'react'

const features = [
  { icon: <Phone className="h-5 w-5" />, text: 'Unlimited voice calls' },
  { icon: <Users className="h-5 w-5" />, text: 'Unlimited lead management' },
  { icon: <BarChart3 className="h-5 w-5" />, text: 'Advanced analytics & reporting' },
  { icon: <Check className="h-5 w-5" />, text: 'Priority customer support' },
]

export default function UpgradePage() {
  const [copied, setCopied] = useState(false)
  const email = 'connect@conversailabs.com'

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = email
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade to Pro Plan
          </h1>
          <p className="text-lg text-gray-600">
            Unlock unlimited calling and advanced features for your voice AI campaigns
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Demo Plan Limitations
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Limited to 5 calls total</li>
                <li>• Can only call verified leads</li>
                <li>• Basic features only</li>
                <li>• Shared daily limits</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Pro Plan Benefits
              </h2>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <div className="text-green-600">
                      {feature.icon}
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Scale Your Voice AI?
          </h3>
          <p className="text-blue-100 mb-6">
            Contact our sales team to discuss pricing and get started with your Pro plan today.
          </p>
          <div className="bg-white/10 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{email}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyEmail}
                className="bg-white text-blue-600 hover:bg-gray-100 ml-3"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}