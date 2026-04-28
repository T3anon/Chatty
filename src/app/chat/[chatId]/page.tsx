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
  const [chatStatus, setChatStatus] = useState("ACTIVE");
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
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
        setMessages(data.messages);
        setChatStatus(data.status);
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

  const handleEndChat = async () => {
    if (!confirm("Are you sure you want to end this chat session?")) return;
    
    setIsEnding(true);
    try {
      const res = await fetch(`/api/chat/${chatId}/end`, {
        method: "POST"
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Failed to end chat", e);
    } finally {
      setIsEnding(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <div className="p-10 text-center">Loading chat...</div>;
  }

  const userId = (session?.user as any)?.id;

  return (
    <div className="flex flex-col h-screen bg-forest-light/30">
      {/* Header */}
      <div className="bg-white border-b border-forest-mid/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-forest-light rounded-full transition">
            <ArrowLeft size={20} className="text-forest-dark" />
          </Link>
          <div>
            <h1 className="font-bold text-forest-deep">1-on-1 Session</h1>
            <p className={`text-xs font-bold ${chatStatus === "ACTIVE" ? "text-green-600" : "text-red-500"}`}>
              {chatStatus === "ACTIVE" ? "Connected" : "Session Ended"}
            </p>
          </div>
        </div>
        
        {chatStatus === "ACTIVE" && (
          <button 
            onClick={handleEndChat}
            disabled={isEnding}
            className="text-sm font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition border border-red-100"
          >
            {isEnding ? "Ending..." : "End Session"}
          </button>
        )}
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatStatus === "ENDED" && (
          <div className="bg-white border border-red-100 p-8 rounded-[2rem] text-center max-w-md mx-auto my-8 shadow-xl shadow-red-900/5">
            <h3 className="text-red-900 font-black text-xl mb-2">The session has ended</h3>
            <p className="text-red-700 font-medium text-sm mb-6">This conversation is now closed. We hope you had a great practice!</p>
            <Link 
              href="/dashboard"
              className="inline-block bg-red-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-red-700 transition shadow-lg shadow-red-200"
            >
              Back to Dashboard
            </Link>
          </div>
        )}
        
        {messages.length === 0 && chatStatus === "ACTIVE" && (
          <div className="text-center py-10 text-forest-dark/40 font-medium italic">
            No messages yet. Say hello!
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === userId;
          const sender = msg.sender || {};
          return (
            <div 
              key={msg.id} 
              className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
            >
              {!isMine && (
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-forest-light flex-shrink-0 mb-1 border border-forest-mid/20">
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-forest-dark/40">
                      {sender.username?.[0]?.toUpperCase() || "?"}
                    </div>
                </div>
              )}
              <div 
                className={`max-w-[75%] p-4 rounded-[1.5rem] shadow-sm ${
                  isMine 
                    ? "bg-forest-dark text-white rounded-br-none" 
                    : "bg-white text-forest-deep border border-forest-mid/10 rounded-bl-none"
                }`}
              >
                {!isMine && (
                  <span className="text-[10px] font-black block mb-1 text-forest-mid uppercase tracking-widest">
                    {sender.username || "Partner"}
                  </span>
                )}
                <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                <span className={`text-[10px] mt-1 block opacity-50 font-bold ${isMine ? "text-right" : ""}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {isMine && (
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-forest-dark flex-shrink-0 mb-1 border border-forest-mid/20">
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-forest-light/50">
                      ME
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className={`p-4 bg-white border-t border-forest-mid/20 ${chatStatus === "ENDED" ? "opacity-50 pointer-events-none" : ""}`}>
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input 
            type="text" 
            placeholder={chatStatus === "ENDED" ? "Chat ended" : "Type your message..."}
            disabled={chatStatus === "ENDED"}
            className="flex-1 bg-forest-light/20 border border-transparent rounded-2xl px-6 py-3 focus:outline-none focus:bg-white focus:border-forest-mid transition-all text-forest-deep font-medium"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button 
            type="submit"
            disabled={chatStatus === "ENDED"}
            className="bg-forest-dark text-white p-3 rounded-2xl hover:bg-forest-deep transition shadow-lg shadow-forest-dark/20 disabled:bg-gray-400"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
