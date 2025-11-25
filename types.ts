
import React from 'react';

export interface Attachment {
  mimeType: string;
  data: string; // Base64 encoded string
  name?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
  groundingSupports?: any[];
  webSearchQueries?: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: Attachment[];
  groundingMetadata?: GroundingMetadata;
  timestamp: number;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}