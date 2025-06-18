// Core application types

export interface User {
  id: string
  sessionId: string
  language: string
  preferences?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  title?: string
  userId: string
  messages: Message[]
  isArchived: boolean
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface FileUpload {
  id: string
  userId: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  status: 'uploaded' | 'processing' | 'processed' | 'error'
  processedContent?: string
  metadata?: Record<string, any>
  uploadedAt: Date
  processedAt?: Date
}

export interface LLMConfiguration {
  id: string
  userId: string
  provider: 'openai' | 'anthropic' | 'deepseek' | 'gemini'
  model: string
  apiKey: string
  isDefault: boolean
  parameters?: {
    temperature?: number
    maxTokens?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ToolExecution {
  toolName: string
  parameters: Record<string, any>
  result?: any
  error?: string
  executionTime?: number
  timestamp: Date
}

export interface SearchResult {
  query: string
  summary: string
  sources: SearchSource[]
  totalSources: number
  searchTime: number
}

export interface SearchSource {
  title: string
  url: string
  snippet: string
  domain: string
  credibilityScore: number
}

export interface CodeExecution {
  id: string
  userId: string
  language: string
  code: string
  output?: string
  error?: string
  status: 'running' | 'completed' | 'error' | 'timeout'
  duration?: number
  executedAt: Date
}

export interface VoiceInteraction {
  id: string
  userId?: string
  audioUrl?: string
  transcript?: string
  response?: string
  language: string
  duration?: number
  status: 'processing' | 'completed' | 'error'
  createdAt: Date
}

// UI Component Types
export interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void
  loading?: boolean
  disabled?: boolean
}

export interface MessageProps {
  message: Message
  isLast?: boolean
}

export interface SidebarProps {
  open: boolean
  onClose: () => void
  conversations: Conversation[]
  currentConversation?: Conversation
  onSelectConversation: (conversation: Conversation) => void
  onCreateNew: () => void
}

export interface HeaderProps {
  onSidebarToggle: () => void
  currentConversation?: Conversation
}

// Tool Types
export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  executionTime?: number
}

export interface ToolParameters {
  [key: string]: {
    type: string
    required?: boolean
    default?: any
    description?: string
  }
}

export interface Tool {
  name: string
  description: string
  parameters: ToolParameters
  execute(parameters: any): Promise<ToolResult>
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ChatResponse {
  conversationId: string
  message: Message
}

export interface FileUploadResponse {
  fileId: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  processedContent?: string
  status: string
}

// Theme and UI Types
export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

// Settings Types
export interface UserSettings {
  theme: Theme
  language: string
  defaultLLM: string
  autoSave: boolean
  notifications: boolean
  voiceEnabled: boolean
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>