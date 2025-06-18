'use client';

import { useState, useEffect } from 'react';
import { Conversation, Message } from '@/lib/types';

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat?userId=default-session');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        if (data.conversations && data.conversations.length > 0) {
          setCurrentConversation(data.conversations[0]);
        }
      } else {
        createWelcomeConversation();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      createWelcomeConversation();
    }
  };

  const createWelcomeConversation = () => {
    const welcomeConversation: Conversation = {
      id: 'welcome',
      title: 'Getting Started with Avilink',
      userId: 'default-session',
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
      messages: [
        {
          id: 'welcome-msg',
          conversationId: 'welcome',
          role: 'assistant',
          content: 'Hello! I\'m Avilink, your advanced AI assistant. I can help you with:\n\n🔍 **DeepSearch**: Comprehensive web research across 20+ credible sources\n🐍 **Python Execution**: Run and analyze Python code securely\n📄 **File Processing**: Analyze PDFs, Word docs, Excel files, and images\n🌐 **Web Browsing**: Browse and analyze web content\n\nWhat would you like to work on today?',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };
    setConversations([welcomeConversation]);
    setCurrentConversation(welcomeConversation);
  };

  const createNewConversation = async () => {
    try {
      const newConversation: Conversation = {
        id: `temp-${Date.now()}`,
        title: 'New Chat',
        userId: 'default-session',
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false,
        messages: []
      };

      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      setCurrentConversation(newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (content: string, files?: File[]) => {
    if (!currentConversation) return;

    setLoading(true);
    
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversation.id,
      role: 'user',
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: files ? { attachments: files.map(f => ({ name: f.name, size: f.size, type: f.type })) } : undefined
    };

    const updatedMessages = [...(currentConversation.messages || []), userMessage];
    
    const updatedConversation = {
      ...currentConversation,
      messages: updatedMessages,
      updatedAt: new Date(),
      title: currentConversation.title || content.slice(0, 50) + (content.length > 50 ? '...' : '')
    };

    setCurrentConversation(updatedConversation);
    
    try {
      const conversationId = currentConversation.id.startsWith('temp-') ? null : currentConversation.id;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: content, 
          conversationId,
          files: files ? Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })) : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      const finalConversation = {
        ...updatedConversation,
        id: data.conversationId,
        messages: [
          ...updatedMessages,
          {
            id: data.message.id,
            conversationId: data.conversationId,
            role: data.message.role,
            content: data.message.content,
            createdAt: new Date(data.message.createdAt),
            updatedAt: new Date(data.message.createdAt)
          }
        ]
      };

      setCurrentConversation(finalConversation);
      
      const finalConversations = conversations.map(conv => 
        conv.id === currentConversation.id || conv.id === data.conversationId 
          ? finalConversation 
          : conv
      );
      setConversations(finalConversations);

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        conversationId: currentConversation.id,
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedMessages, errorMessage]
      };

      setCurrentConversation(errorConversation);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const executeTool = async (toolName: string, parameters: any) => {
    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName,
          parameters,
          conversationId: currentConversation?.id
        })
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Tool execution error:', error);
      throw error;
    }
  };

  return {
    conversations,
    currentConversation,
    loading,
    createNewConversation,
    sendMessage,
    selectConversation,
    executeTool
  };
}