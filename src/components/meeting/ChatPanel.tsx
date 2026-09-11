import { useState, useEffect, useRef, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatMessage } from '@/types';
import { formatChatTime } from '@/utils/meeting-code';
import { Avatar } from '@/components/ui/Avatar';
import { Send, MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  meetingId: string;
  meetingDbId: string;
}

export function ChatPanel({ meetingId, meetingDbId }: ChatPanelProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMessages() {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('meeting_id', meetingDbId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (data) setMessages(data as ChatMessage[]);
      setLoading(false);
    }
    fetchMessages();

    const channel = supabase
      .channel(`chat:${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `meeting_id=eq.${meetingDbId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, meetingDbId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    setSending(true);
    const msg = input.trim();
    setInput('');
    await supabase.from('chat_messages').insert({
      meeting_id: meetingDbId,
      user_id: user.id,
      sender_name: profile?.display_name ?? 'User',
      message: msg,
    });
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-navy-700/50">
        <h3 className="text-sm font-semibold text-navy-100 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Meeting Chat
        </h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-navy-400">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-navy-600 mb-3" />
            <p className="text-sm text-navy-400">No messages yet.</p>
            <p className="text-xs text-navy-500 mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar name={msg.sender_name} size="sm" className="flex-shrink-0" />
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-navy-200">
                      {isOwn ? 'You' : msg.sender_name}
                    </span>
                    <span className="text-[10px] text-navy-500">{formatChatTime(msg.created_at)}</span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm ${
                      isOwn
                        ? 'bg-accent-500/20 text-navy-50 rounded-tr-sm'
                        : 'bg-navy-800/60 text-navy-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-navy-700/50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 rounded-xl bg-navy-800/60 border border-navy-700 text-sm text-navy-50 placeholder-navy-400 focus:border-accent-400 focus:ring-1 focus:ring-accent-400 outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 rounded-xl bg-accent-500 hover:bg-accent-400 text-navy-950 disabled:opacity-50 transition-colors"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
