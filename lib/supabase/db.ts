/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from './client';
import { MessageNode } from '@/lib/store/chat-store';

export async function createChat(title: string = "New Chat") {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
      console.error("createChat Auth Error:", authError);
      throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: user.id, title })
    .select()
    .single();

  if (error) {
      console.error("createChat DB Error:", error);
      throw error;
  }
  return data;
}

export async function createChatBranch(originalChatId: string, messageId: string, title: string = "Branch") {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from('chats')
        .insert({ 
            user_id: user.id, 
            title, 
            branched_from_chat_id: originalChatId,
            branched_from_message_id: messageId
        })
        .select()
        .single();
    
    if (error) {
        console.error("createChatBranch DB Error:", error);
        throw error;
    }
    return data;
}

// Helper to fetch full ancestor chain (recursive)
async function fetchAncestorMessages(chatId: string, limitMessageId?: string): Promise<any[]> {
    const supabase = createClient();
    
    // 1. Get Chat Info to see if it has a parent
    const { data: chat } = await supabase.from('chats').select('branched_from_chat_id, branched_from_message_id').eq('id', chatId).single();
    
    if (!chat) return [];

    let messages: any[] = []; // keeping any for now to avoid large refactor, will fix const query
    
    // 2. Fetch messages for THIS chat
    const query = supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
    
    // If we only need up to a specific message (for the parent context)
    if (limitMessageId) {
        // We can't easily do "up to" by ID in SQL without a join or knowing timestamp. 
        // For accurate branching, we usually fetch the parent chain UP TO the branch point.
        // We'll filter in memory or use timestamp if available, but ID is safer.
        // Actually, let's just fetch all and filter in JS for now as optimization.
    }

    const { data: currentMessages } = await query;
    if (currentMessages) {
        const sorted = currentMessages; 
        // If limit provided, cut off after that message
        if (limitMessageId) {
            const index = sorted.findIndex(m => m.id === limitMessageId);
            if (index !== -1) {
                messages = sorted.slice(0, index + 1);
            } else {
                 messages = sorted;
            }
        } else {
            messages = sorted;
        }
    }

    // 3. Recursive step: If this chat has a parent, go up
    if (chat.branched_from_chat_id && chat.branched_from_message_id) {
        const parentMessages = await fetchAncestorMessages(chat.branched_from_chat_id, chat.branched_from_message_id);
        return [...parentMessages, ...messages];
    }

    return messages;
}

export async function fetchMessages(chatId: string) {
    // Use the recursive fetcher
    return fetchAncestorMessages(chatId);
}

export async function saveMessage(chatId: string, message: MessageNode) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('messages')
    .insert({
      id: message.id, // Ensure we use the same ID as frontend for consistency
      chat_id: chatId,
      role: message.role,
      content: message.content,
      parent_id: message.parentId,
      model: 'mistral-large-latest', // Hardcoded for now, should be dynamic
      attachments: message.attachments || null
    });

  if (error) {
      console.error("saveMessage DB Error:", error);
      throw error;
  }
}

export async function fetchUserChats() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .order('updated_at', { ascending: false });
    
  if (error) throw error;
  return data;
}

// Old fetchMessages replaced by recursive version above
export async function updateChatTitle(chatId: string, title: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('chats')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (error) {
    console.error("updateChatTitle DB Error:", error);
    throw error;
  }
}

export async function deleteChat(chatId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId);

  if (error) {
    console.error("deleteChat DB Error:", error);
    throw error;
  }
}

export async function updateChat(chatId: string, updates: { title?: string; is_pinned?: boolean; is_archived?: boolean }) {
  const supabase = createClient();
  const { error } = await supabase
    .from('chats')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (error) {
    console.error("updateChat DB Error:", error);
    throw error;
  }
}

export async function fetchUserGallery() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      chats (
        id,
        title
      )
    `)
    .ilike('content', '%![%') // Filter for markdown images
    .eq('role', 'assistant') // Only AI generated (usually)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data;
}
