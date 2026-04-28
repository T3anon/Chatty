"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isQueued, setIsQueued] = useState(false);
  const [queueStatus, setQueueStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user && !(session.user as any).username) {
      router.push("/profile/create");
    }
  }, [status, session, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQueued) {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/queue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "status" }),
          });
          const data = await res.json();
          if (data.matched) {
            setIsQueued(false);
            setQueueStatus("Matched! Redirecting...");
            router.push(`/chat/${data.chatId}`);
          } else {
            setIsQueued(data.isQueued);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isQueued, router]);

  const toggleQueue = async () => {
    setIsLoading(true);
    try {
      const action = isQueued ? "leave" : "join";
      const res = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      
      if (data.matched) {
        setIsQueued(false);
        setQueueStatus("Matched! Redirecting...");
        router.push(`/chat/${data.chatId}`);
      } else {
        setIsQueued(action === "join");
        setQueueStatus(action === "join" ? "Waiting for a partner..." : "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") return <div className="p-10 text-center font-medium text-gray-500">Cultivating your dashboard...</div>;

  return (
    <div className="min-h-screen bg-forest-light/30 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-forest-mid/20">
          <div>
            <h1 className="text-2xl font-black text-forest-deep tracking-tight">
              Welcome back, {session?.user?.name?.split(' ')[0] || "Gardener"}
            </h1>
            <p className="text-forest-dark/60 text-sm font-medium">Your language garden is thriving</p>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-forest-light text-forest-dark px-5 py-2.5 rounded-xl font-bold hover:bg-forest-mid/30 transition border border-forest-mid/20"
          >
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Queue Section */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-forest-dark/5 border border-forest-mid/10 text-center">
            <div className="w-20 h-20 bg-forest-light rounded-3xl flex items-center justify-center mx-auto mb-6">
              <div className={`w-10 h-10 border-4 border-forest-dark border-t-transparent rounded-full ${isQueued ? 'animate-spin' : ''}`}></div>
            </div>
            
            <h2 className="text-3xl font-black text-forest-deep mb-3">1-on-1 Peer Talk</h2>
            <p className="text-forest-dark/70 mb-8 max-w-sm mx-auto font-medium">
              Jump into a live queue to connect with someone and practice your languages instantly.
            </p>

            <button 
              onClick={toggleQueue}
              disabled={isLoading}
              className={`w-full max-w-md py-5 rounded-2xl font-black text-lg transition-all transform active:scale-[0.98] shadow-lg ${
                isQueued 
                  ? "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100" 
                  : "bg-forest-dark text-white hover:bg-forest-deep shadow-forest-dark/20"
              }`}
            >
              {isLoading ? "Processing..." : isQueued ? "Leave Queue" : "Join Queue"}
            </button>
            
            {isQueued && (
              <p className="mt-4 text-forest-mid font-bold animate-pulse">
                {queueStatus}
              </p>
            )}
            
            {!isQueued && (
              <div className="mt-6 flex justify-center gap-4 text-xs font-bold text-forest-dark/40 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Ready to connect
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-forest-mid rounded-full"></span>
                  1-on-1 Text Chat
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50 grayscale pointer-events-none">
             <div className="bg-white/50 p-6 rounded-3xl border border-dashed border-forest-mid/30">
                <h3 className="font-bold text-forest-dark mb-1 text-sm uppercase tracking-wider">Coming Soon</h3>
                <p className="text-forest-dark/40 text-sm font-medium">Find specialized teachers for 1-on-1 coaching.</p>
             </div>
             <div className="bg-white/50 p-6 rounded-3xl border border-dashed border-forest-mid/30">
                <h3 className="font-bold text-forest-dark mb-1 text-sm uppercase tracking-wider">Coming Soon</h3>
                <p className="text-forest-dark/40 text-sm font-medium">Specialized learning modules.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
