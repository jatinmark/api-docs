'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { whatsappApi } from '@/lib/whatsapp-api'
import { WhatsAppConversation, WhatsAppMessage } from '@/types/whatsapp'
import { Search, Send, Phone, Clock, User, MessageSquare, PhoneCall } from 'lucide-react'
import { logger } from '@/lib/logger'

interface WhatsAppConversationsProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName: string
}

export function WhatsAppConversations({ isOpen, onClose, agentId, agentName }: WhatsAppConversationsProps) {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null)
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchConversations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, agentId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const response = await whatsappApi.getConversations({ agent_id: agentId })
      setConversations(response.data.conversations)
      if (response.data.conversations.length > 0) {
        setSelectedConversation(response.data.conversations[0])
      }
    } catch (error) {
      logger.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await whatsappApi.getConversationMessages(conversationId)
      setMessages(response.data.messages)
    } catch (error) {
      logger.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    setSending(true)
    try {
      await whatsappApi.sendMessage(selectedConversation.id, {
        message_type: 'text',
        content: newMessage,
        metadata: { agent_id: agentId }
      })
      
      // Add message to local state optimistically
      const newMsg: WhatsAppMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: selectedConversation.id,
        message_type: 'text',
        content: newMessage,
        sender_type: 'agent',
        sender_id: agentId,
        timestamp: new Date().toISOString(),
        status: 'sent',
        metadata: {}
      }
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
      
      // Refresh messages after a short delay
      setTimeout(() => fetchMessages(selectedConversation.id), 1000)
    } catch (error) {
      logger.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`WhatsApp Conversations - ${agentName}`} size="xl">
      <div className="flex h-[600px]">
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No WhatsApp conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      conversation.status === 'active' ? 'bg-green-500' : 
                      conversation.status === 'waiting' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.contact_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(conversation.last_message_timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message}
                        </p>
                        {conversation.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <Phone className="inline h-3 w-3 mr-1" />
                        {conversation.contact_phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedConversation.contact_name}</h3>
                    <p className="text-sm text-gray-600">{selectedConversation.contact_phone}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedConversation.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedConversation.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedConversation.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {/* System messages (voice call notifications) */}
                    {message.sender_type === 'system' ? (
                      <div className="flex justify-center">
                        <div className="bg-orange-100 border border-orange-200 rounded-lg px-4 py-2 max-w-md">
                          <div className="flex items-center space-x-2">
                            <PhoneCall className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-800 font-medium">{message.content}</span>
                          </div>
                          <p className="text-xs text-orange-600 mt-1 text-center">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Regular messages */
                      <div className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_type === 'agent'
                            ? message.metadata?.suggested_handoff || message.metadata?.post_call_summary
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}>
                          {/* Special indicators for handoff suggestions and summaries */}
                          {message.metadata?.suggested_handoff && (
                            <div className="flex items-center space-x-1 mb-1">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs font-medium">Handoff Suggestion</span>
                            </div>
                          )}
                          {message.metadata?.post_call_summary && (
                            <div className="flex items-center space-x-1 mb-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-xs font-medium">Post-Call Summary</span>
                            </div>
                          )}
                          
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_type === 'agent' ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                            {message.sender_type === 'agent' && (
                              <span className="ml-2">
                                {message.status === 'sent' && '✓'}
                                {message.status === 'delivered' && '✓✓'}
                                {message.status === 'read' && '✓✓'}
                                {message.status === 'failed' && '⚠️'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col space-y-2">
                  {/* Quick Actions */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setNewMessage("Would you like me to call you instead? It might be easier to discuss over the phone.")}
                      variant="outline"
                      size="sm"
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Suggest Call
                    </Button>
                    <Button
                      onClick={() => setNewMessage("Thanks for the call! Here's a summary of what we discussed:")}
                      variant="outline"
                      size="sm"
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Post-Call Summary
                    </Button>
                  </div>
                  
                  {/* Message Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}