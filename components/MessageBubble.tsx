
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { SparkleIcon, UserIcon, GlobeIcon } from './Icon';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 w-full max-w-3xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
            <UserIcon className="w-5 h-5" />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.isStreaming ? 'animate-pulse' : ''}`}>
             <SparkleIcon className="w-7 h-7" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="font-medium text-sm text-gray-300 mb-1">
          {isUser ? 'You' : 'Gemini'}
        </div>
        
        {/* Render Attachments if they exist */}
        {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
                {message.attachments.map((att, idx) => (
                    <div key={idx} className="rounded-xl overflow-hidden border border-gray-700 max-w-[300px]">
                        {att.mimeType.startsWith('image/') ? (
                            <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt="User upload" 
                                className="max-h-64 object-contain bg-[#1E1F20]"
                            />
                        ) : (
                            <div className="p-4 bg-[#1E1F20] flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-300">{att.mimeType}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}

        <div className={`prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1E1F20] prose-pre:rounded-lg prose-pre:border prose-pre:border-[#444746] max-w-none text-[15px] leading-7 text-gray-100`}>
          {message.text ? (
             <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline ? (
                      <div className="relative group my-4">
                         <div className="absolute right-2 top-2 text-xs text-gray-500 font-mono">{match ? match[1] : 'code'}</div>
                         <code className={`${className} block overflow-x-auto p-4 bg-[#1E1F20] rounded-lg border border-[#444746]`} {...props}>
                          {children}
                        </code>
                      </div>
                    ) : (
                      <code className="bg-[#282A2C] px-1.5 py-0.5 rounded text-sm font-mono text-pink-300" {...props}>
                        {children}
                      </code>
                    )
                  },
                  table({children}) {
                    return (
                      <div className="overflow-x-auto my-4 border border-[#444746] rounded-lg">
                        <table className="min-w-full divide-y divide-[#444746]">
                          {children}
                        </table>
                      </div>
                    )
                  },
                  thead({children}) {
                    return <thead className="bg-[#1E1F20]">{children}</thead>
                  },
                  tbody({children}) {
                    return <tbody className="divide-y divide-[#444746] bg-[#131314]">{children}</tbody>
                  },
                  tr({children}) {
                    return <tr className="hover:bg-[#1E1F20]/50 transition-colors">{children}</tr>
                  },
                  th({children}) {
                    return <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{children}</th>
                  },
                  td({children}) {
                    return <td className="px-4 py-3 text-sm text-gray-300 whitespace-normal">{children}</td>
                  }
                }}
             >
               {message.text}
             </ReactMarkdown>
          ) : (
             // Loading state
             !isUser && (
                <div className="flex space-x-1 items-center h-6">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
             )
          )}
        </div>
        
        {/* Grounding / Sources Display */}
        {message.groundingMetadata && message.groundingMetadata.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
           <div className="mt-4 pt-4 border-t border-[#444746]/50">
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                 <GlobeIcon className="w-4 h-4" />
                 <span className="uppercase tracking-wider font-medium">Sources</span>
              </div>
              <div className="flex flex-wrap gap-2">
                 {message.groundingMetadata.groundingChunks.map((chunk, idx) => (
                   chunk.web ? (
                     <a 
                       key={idx} 
                       href={chunk.web.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-2 bg-[#1E1F20] hover:bg-[#2D2E30] border border-[#444746] rounded-full px-3 py-1.5 text-xs text-blue-300 transition-colors max-w-xs truncate"
                       title={chunk.web.title}
                     >
                       <div className="truncate max-w-[150px]">{chunk.web.title}</div>
                     </a>
                   ) : null
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;