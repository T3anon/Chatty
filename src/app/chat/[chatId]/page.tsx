"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, ArrowLeft } from "lucide-react";

export default function ChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { data: session, status } = useSession();
  const { chatId } = use(params);
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setIsLoading(false); // Success, hide loading
      } else if (res.status === 403 || res.status === 404) {
        // Not authorized or chat doesn't exist
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage("");

    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } catch (e) {
      console.error("Failed to send message", e);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="p-10 text-center">Loading chat...</div>;
  }

  const userId = (session?.user as any)?.id;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900">1-on-1 Session</h1>
          <p className="text-xs text-green-500 font-medium">Connected</p>
        </div>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400 italic">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === userId;
          return (
            <div 
              key={msg.id} 
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                  isMine 
                    ? "bg-purple-600 text-white rounded-br-none" 
                    : "bg-white text-gray-800 border rounded-bl-none"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className={`text-[10px] mt-1 block opacity-70 ${isMine ? "text-right" : ""}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition shadow-md shadow-purple-200"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
