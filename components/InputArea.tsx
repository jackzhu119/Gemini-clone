import React, { useState, useRef, useEffect } from 'react';
import { SendIcon, PlusIcon, XMarkIcon } from './Icon';
import { Attachment } from '../types';

interface InputAreaProps {
  onSendMessage: (text: string, attachments: Attachment[]) => void;
  isLoading: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input, attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            const newAttachment: Attachment = {
                mimeType: file.type,
                data: base64String,
                name: file.name
            };
            setAttachments(prev => [...prev, newAttachment]);
        };
        
        reader.readAsDataURL(file);
    }
    // Reset file input value so same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2 relative">
       <div className="relative bg-gemini-sidebar rounded-[28px] border border-[#444746]/50 focus-within:bg-[#282A2C] focus-within:border-gray-500 transition-colors shadow-lg">
          
          {/* Attachment Preview Area */}
          {attachments.length > 0 && (
              <div className="flex gap-3 p-3 pb-0 overflow-x-auto">
                  {attachments.map((att, index) => (
                      <div key={index} className="relative group shrink-0">
                          {att.mimeType.startsWith('image/') ? (
                             <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt="preview" 
                                className="h-16 w-16 object-cover rounded-lg border border-gray-600"
                             />
                          ) : (
                              <div className="h-16 w-16 flex items-center justify-center bg-gray-700 rounded-lg border border-gray-600 text-[10px] text-center p-1 break-all">
                                  {att.mimeType}
                              </div>
                          )}
                          <button 
                             onClick={() => removeAttachment(index)}
                             className="absolute -top-1.5 -right-1.5 bg-gray-600 rounded-full p-0.5 text-white hover:bg-gray-500 shadow-md"
                          >
                             <XMarkIcon className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
              </div>
          )}

          <div className="flex items-end p-2 gap-2">
              <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,text/*"
              />
              <button 
                  onClick={triggerFileInput}
                  className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-[#37393b] transition-colors"
                  title="Upload image or file"
              >
                  <PlusIcon className="w-5 h-5" />
              </button>
              
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachments.length > 0 ? "What do you want to know about this?" : "Ask Gemini"}
                className="flex-1 max-h-[200px] py-3 bg-transparent text-base text-gray-100 placeholder-gray-400 focus:outline-none resize-none overflow-y-auto leading-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                rows={1}
                disabled={isLoading}
              />

              <button 
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                    (input.trim() || attachments.length > 0) && !isLoading 
                    ? 'text-white bg-blue-600 hover:bg-blue-500' 
                    : 'text-gray-500 bg-transparent cursor-not-allowed'
                }`}
              >
                  <SendIcon className="w-5 h-5 transform rotate-0" />
              </button>
          </div>
       </div>
       <div className="text-center text-xs text-gray-500 mt-3">
          Gemini may display inaccurate info, including about people, so double-check its responses.
       </div>
    </div>
  );
};

export default InputArea;