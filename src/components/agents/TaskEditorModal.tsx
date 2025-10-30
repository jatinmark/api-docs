import React, { memo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface TaskItem {
  task: string
}

interface TaskEditorModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: TaskItem[]
  onSave: (tasks: TaskItem[]) => Promise<void>
  isGenerating: boolean
}

export const TaskEditorModal = memo(({ 
  isOpen, 
  onClose, 
  tasks, 
  onSave,
  isGenerating 
}: TaskEditorModalProps) => {
  const [editingTasks, setEditingTasks] = React.useState<TaskItem[]>(tasks)

  React.useEffect(() => {
    setEditingTasks(tasks)
  }, [tasks])

  const handleTaskChange = (index: number, value: string) => {
    setEditingTasks(prev => {
      const newTasks = [...prev]
      newTasks[index] = { ...newTasks[index], task: value }
      return newTasks
    })
  }

  const handleAddTask = () => {
    setEditingTasks([...editingTasks, { task: '' }])
  }

  const handleDeleteTask = (index: number) => {
    if (editingTasks.length <= 3) {
      toast.error('Must maintain at least 3 tasks')
      return
    }
    const newTasks = editingTasks.filter((_, i) => i !== index)
    setEditingTasks(newTasks)
  }

  const handleSave = async () => {
    await onSave(editingTasks)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Tasks"
      size="lg" 
      zIndex={100}
    >
      <div className="p-6">
        <p className="text-gray-600 mb-4">Edit the generated tasks below.</p>
        
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 mb-4">
          {editingTasks.map((task, index) => (
            <div key={index} className="group relative bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium text-sm mt-1">{index + 1}.</span>
                
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={task.task}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    className="w-full p-2 text-sm font-medium border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter task title..."
                  />
                </div>

                {editingTasks.length > 3 && (
                  <button
                    onClick={() => handleDeleteTask(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                    title="Delete Task"
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
          onClick={handleAddTask}
          className="w-full border-dashed mb-4"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">+</span>
            Add Task
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
            {isGenerating ? 'Saving...' : 'Save Tasks'}
          </Button>
        </div>
      </div>
    </Modal>
  )
})

TaskEditorModal.displayName = 'TaskEditorModal'