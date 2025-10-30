import React, { memo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface FAQItem {
  question: string
  answer: string
}

interface FAQEditorModalProps {
  isOpen: boolean
  onClose: () => void
  faqs: FAQItem[]
  onSave: (faqs: FAQItem[]) => Promise<void>
  isGenerating: boolean
}

export const FAQEditorModal = memo(({ 
  isOpen, 
  onClose, 
  faqs, 
  onSave,
  isGenerating 
}: FAQEditorModalProps) => {
  const [editingFAQs, setEditingFAQs] = React.useState<FAQItem[]>(faqs)

  React.useEffect(() => {
    setEditingFAQs(faqs)
  }, [faqs])

  const handleFAQChange = (index: number, field: 'question' | 'answer', value: string) => {
    setEditingFAQs(prev => {
      const newFAQs = [...prev]
      newFAQs[index] = { ...newFAQs[index], [field]: value }
      return newFAQs
    })
  }

  const handleAddFAQ = () => {
    setEditingFAQs([...editingFAQs, { question: '', answer: '' }])
  }

  const handleDeleteFAQ = (index: number) => {
    if (editingFAQs.length <= 5) {
      toast.error('Must maintain at least 5 FAQs')
      return
    }
    const newFAQs = editingFAQs.filter((_, i) => i !== index)
    setEditingFAQs(newFAQs)
  }

  const handleSave = async () => {
    await onSave(editingFAQs)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit FAQs"
      size="lg" 
      zIndex={100}
    >
      <div className="p-6">
        <p className="text-gray-600 mb-4">Edit the generated FAQ questions and answers below.</p>
        
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 mb-4">
          {editingFAQs.map((faq, index) => (
            <div key={index} className="group relative bg-gray-50 rounded-md p-2 hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium text-sm mt-1">{index + 1}.</span>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Q:</span>
                    <textarea
                      value={faq.question}
                      onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
                      className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none min-h-[40px]"
                      placeholder="Enter question..."
                    />
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-600">A:</span>
                    <textarea
                      value={faq.answer}
                      onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
                      className="flex-1 p-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none min-h-[50px]"
                      placeholder="Enter answer..."
                    />
                  </div>
                </div>

                {editingFAQs.length > 5 && (
                  <button
                    onClick={() => handleDeleteFAQ(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                    title="Delete FAQ"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <Button
          variant="outline"
          onClick={handleAddFAQ}
          className="w-full border-dashed mb-4"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">+</span>
            Add FAQ
          </span>
        </Button>
        
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? 'Saving...' : 'Save FAQs'}
          </Button>
        </div>
      </div>
    </Modal>
  )
})

FAQEditorModal.displayName = 'FAQEditorModal'