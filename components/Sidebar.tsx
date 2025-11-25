import React from 'react';
import { SidebarProps } from '../types';
import { PlusIcon, MenuIcon, TrashIcon, HistoryIcon } from './Icon';

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={toggleSidebar}
      />

      {/* Sidebar Container */}
      <div 
        className={`fixed md:relative z-50 flex flex-col h-full bg-gemini-sidebar w-[280px] transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'} ${!isOpen && 'md:w-0'}`}
      >
        <div className="p-4 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gemini-surface rounded-full text-gemini-text/80 transition-colors md:hidden">
            <MenuIcon />
          </button>
        </div>

        <div className="px-4 pb-4">
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className="flex items-center gap-3 w-full bg-gemini-surface hover:bg-gemini-accent/50 text-gemini-text py-3 px-4 rounded-full transition-all duration-200 border border-transparent hover:border-gemini-accent/30 shadow-sm"
          >
            <PlusIcon className="w-5 h-5 text-gray-300" />
            <span className="font-medium text-sm">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          <div className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recent
          </div>
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              <HistoryIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No recent chats
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id}
                className={`group flex items-center justify-between rounded-full px-4 py-2 my-1 cursor-pointer transition-colors ${currentSessionId === session.id ? 'bg-[#004A77] text-blue-100' : 'hover:bg-gemini-surface text-gray-300'}`}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
              >
                <div className="truncate text-sm flex-1 pr-2" title={session.title}>
                  {session.title}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id, e);
                  }}
                  className={`p-1 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'text-blue-200' : 'text-gray-400'}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 mt-auto border-t border-gemini-surface">
          <div className="flex items-center gap-3 px-2 py-2 text-xs text-gemini-text/60">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Location: Taiwan (Based on IP)
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
