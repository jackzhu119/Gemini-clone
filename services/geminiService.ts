
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION } from "../constants";
import { Message, Attachment } from "../types";

// Initialize the API client
// Note: Using process.env.API_KEY as required by the coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let activeChat: Chat | null = null;
let activeChatId: string | null = null;

/**
 * Initializes or retrieves a chat session.
 * Reconstructs history from the stored messages, including attachments.
 */
export const getChatSession = (sessionId: string, history: Message[] = []) => {
  // If we are switching sessions, we need to create a new chat instance
  // initialized with the history of that session.
  if (!activeChat || activeChatId !== sessionId) {
    const formattedHistory = history.map(msg => {
      // Create parts array
      const parts: any[] = [];
      
      // Add attachments if they exist
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }

      // Add text part (Text should generally be last if accompanying images in the same turn,
      // though Gemini is flexible, keeping text ensures context is clear)
      if (msg.text) {
          parts.push({ text: msg.text });
      }

      return {
        role: msg.role,
        parts: parts
      };
    });

    activeChat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        // Enable Google Search for real-time information and better problem solving
        tools: [{ googleSearch: {} }],
      },
      history: formattedHistory
    });
    activeChatId = sessionId;
  }
  return activeChat;
};

/**
 * Sends a message (text + optional attachments) to the Gemini API and returns a stream of responses.
 * Yields objects containing text chunks and optional grounding metadata.
 */
export async function* sendMessageStream(
  text: string, 
  attachments: Attachment[] = [],
  sessionId: string,
  existingHistory: Message[]
) {
  try {
    const chat = getChatSession(sessionId, existingHistory);
    
    // Construct the current message content
    const parts: any[] = [];
    
    if (attachments.length > 0) {
      attachments.forEach(att => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }
    
    if (text) {
      parts.push({ text: text });
    }

    const resultStream = await chat.sendMessageStream({
      message: { parts }
    });

    for await (const chunk of resultStream) {
      // Cast chunk to GenerateContentResponse
      const c = chunk as GenerateContentResponse;
      
      yield {
        text: c.text || "",
        groundingMetadata: c.candidates?.[0]?.groundingMetadata
      };
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
}