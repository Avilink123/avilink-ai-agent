'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { WelcomeScreen } from '@/components/welcome/welcome-screen';
import { useChat } from '@/hooks/use-chat';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { 
    conversations, 
    currentConversation, 
    createNewConversation, 
    sendMessage,
    selectConversation,
    loading,
    executeTool
  } = useChat();
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Show welcome screen if no conversations exist or current conversation has no messages
    setShowWelcome(conversations.length === 0 || (currentConversation && currentConversation.messages.length === 0));
  }, [conversations, currentConversation]);

  const handleStartChat = () => {
    if (conversations.length === 0) {
      createNewConversation();
    }
    setShowWelcome(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={selectConversation}
        onCreateNew={createNewConversation}
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          currentConversation={currentConversation}
        />
        
        {/* Chat Area */}
        <main className="flex-1 overflow-hidden">
          {showWelcome ? (
            <WelcomeScreen onStartChat={handleStartChat} />
          ) : (
            <ChatInterface 
              conversation={currentConversation} 
              onSendMessage={sendMessage}
              onExecuteTool={executeTool}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}