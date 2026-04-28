"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut, User as UserIcon } from "lucide-react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user && !(session.user as any).username) {
      router.push("/profile/create");
    }
  }, [status, session, router]);

  const [isQueued, setIsQueued] = useState(false);
  const [queueStatus, setQueueStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeWaiters, setActiveWaiters] = useState(0);

  // Coaching Queue State
  const [isCoachingQueued, setIsCoachingQueued] = useState(false);
  const [coachingStatus, setCoachingStatus] = useState("");
  const [isCoachingLoading, setIsCoachingLoading] = useState(false);
  const [activeCoachingWaiters, setActiveCoachingWaiters] = useState(0);
  const [coachingRole, setCoachingRole] = useState<"TEACHER" | "STUDENT" | "">("");
  const [selectedCoachingLangs, setSelectedCoachingLangs] = useState<string[]>([]);

  // Poll for queue status and count
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Peer Queue Status
        const res = await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        const data = await res.json();
        
        if (data.queueCount !== undefined) {
          setActiveWaiters(data.queueCount);
        }

        if (data.matched) {
          setIsQueued(false);
          setQueueStatus("Matched! Redirecting...");
          setTimeout(() => router.push(`/chat/${data.chatId}`), 500);
        } else {
          setIsQueued(data.isQueued);
          if (data.isQueued) {
            setQueueStatus("Waiting for a partner...");
          }
        }

        // Coaching Queue Status
        const coachingRes = await fetch("/api/coaching", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        const coachingData = await coachingRes.json();

        if (coachingData.queueCount !== undefined) {
          setActiveCoachingWaiters(coachingData.queueCount);
        }

        if (coachingData.matched) {
          setIsCoachingQueued(false);
          setCoachingStatus("Matched! Redirecting...");
          setTimeout(() => router.push(`/chat/${coachingData.chatId}`), 500);
        } else {
          setIsCoachingQueued(coachingData.isQueued);
          if (coachingData.isQueued) {
            setCoachingStatus("Waiting for a coaching partner...");
          }
        }

      } catch (e) {
        console.error(e);
      }
    };

    // Initial check
    checkStatus();

    // Set up polling
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [router]);

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
      
      if (data.queueCount !== undefined) {
        setActiveWaiters(data.queueCount);
      }

      if (data.matched) {
        setIsQueued(false);
        setQueueStatus("Matched! Redirecting...");
        setTimeout(() => router.push(`/chat/${data.chatId}`), 1000);
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

  const toggleCoachingQueue = async () => {
    if (!isCoachingQueued && (!coachingRole || selectedCoachingLangs.length === 0)) {
      alert("Please select a role and at least one language.");
      return;
    }

    setIsCoachingLoading(true);
    try {
      const action = isCoachingQueued ? "leave" : "join";
      const res = await fetch("/api/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action,
          role: coachingRole,
          languages: selectedCoachingLangs.join(",")
        }),
      });
      const data = await res.json();
      
      if (data.queueCount !== undefined) {
        setActiveCoachingWaiters(data.queueCount);
      }

      if (data.matched) {
        setIsCoachingQueued(false);
        setCoachingStatus("Matched! Redirecting...");
        setTimeout(() => router.push(`/chat/${data.chatId}`), 1000);
      } else {
        setIsCoachingQueued(action === "join");
        setCoachingStatus(action === "join" ? "Waiting for a coaching partner..." : "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCoachingLoading(false);
    }
  };

  const toggleCoachingLang = (lang: string) => {
    setSelectedCoachingLangs(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  if (status === "loading") return <div className="p-10 text-center font-medium text-gray-500">Cultivating your dashboard...</div>;

  const userFluent = ((session?.user as any)?.fluentLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean);
  const userLearning = ((session?.user as any)?.learningLanguages || "").split(",").map((s: string) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-forest-light/30 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-forest-mid/20">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="relative group">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-forest-light flex items-center justify-center border-2 border-forest-mid/20 group-hover:border-forest-dark transition-all">
                <UserIcon className="w-8 h-8 text-forest-dark/40" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-forest-dark text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Settings size={12} />
              </div>
            </Link>
            <div>
              <h1 className="text-2xl font-black text-forest-deep tracking-tight">
                Welcome back {(session?.user as any)?.username || "Gardener"}!
              </h1>
              <p className="text-forest-dark/60 text-sm font-medium">Your language garden is thriving</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-forest-light text-forest-dark px-5 py-2.5 rounded-xl font-bold hover:bg-forest-mid/30 transition border border-forest-mid/20 flex items-center gap-2"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Queue Section */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-forest-dark/5 border border-forest-mid/10 text-center">
            <div className="w-20 h-20 bg-forest-light rounded-3xl flex items-center justify-center mx-auto mb-6">
              <div className={`w-10 h-10 border-4 border-forest-dark border-t-transparent rounded-full ${isQueued ? 'animate-spin' : ''}`}></div>
            </div>
            
            <h2 className="text-3xl font-black text-forest-deep mb-3">1-on-1 Peer Talk</h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm font-bold text-forest-dark/60 uppercase tracking-widest">
                {activeWaiters} {activeWaiters === 1 ? 'person' : 'people'} in queue
              </span>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-forest-mid/20 shadow-sm">
                <h3 className="font-bold text-forest-deep mb-4 text-sm uppercase tracking-wider text-center">1-on-1 Coaching</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-md border-forest-mid text-forest-dark focus:ring-forest-dark"
                        checked={coachingRole === "TEACHER"}
                        disabled={isCoachingQueued}
                        onChange={() => {
                          setCoachingRole("TEACHER");
                          setSelectedCoachingLangs([]);
                        }}
                      />
                      <span className="font-bold text-forest-dark group-hover:text-forest-deep transition-colors">Teach</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-md border-forest-mid text-forest-dark focus:ring-forest-dark"
                        checked={coachingRole === "STUDENT"}
                        disabled={isCoachingQueued}
                        onChange={() => {
                          setCoachingRole("STUDENT");
                          setSelectedCoachingLangs([]);
                        }}
                      />
                      <span className="font-bold text-forest-dark group-hover:text-forest-deep transition-colors">Learn</span>
                    </label>
                  </div>

                  {coachingRole && (
                    <div className="bg-forest-light/30 p-4 rounded-2xl">
                      <p className="text-xs font-black text-forest-dark uppercase tracking-widest mb-3 text-center">
                        Select Language to {coachingRole === "TEACHER" ? "Teach" : "Learn"}
                      </p>
                      <div className="flex justify-center">
                        <select
                          disabled={isCoachingQueued}
                          value={selectedCoachingLangs[0] || ""}
                          onChange={(e) => setSelectedCoachingLangs(e.target.value ? [e.target.value] : [])}
                          className="w-full max-w-xs bg-white border border-forest-mid/20 rounded-xl px-4 py-2.5 text-sm font-bold text-forest-dark focus:ring-forest-dark focus:border-forest-dark outline-none transition-all cursor-pointer"
                        >
                          <option value="">Choose a language...</option>
                          {(coachingRole === "TEACHER" ? userFluent : userLearning).map((lang: string) => (
                            <option key={lang} value={lang}>
                              {lang}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={toggleCoachingQueue}
                    disabled={isCoachingLoading || (isQueued && !isCoachingQueued)}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all transform active:scale-[0.98] shadow-md ${
                      isCoachingQueued 
                        ? "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100" 
                        : isQueued 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-forest-mid text-forest-deep hover:bg-forest-dark hover:text-white"
                    }`}
                  >
                    {isCoachingLoading ? "Processing..." : isCoachingQueued ? "Leave Coaching Queue" : "Find a Partner"}
                  </button>

                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                      <span className="text-[10px] font-bold text-forest-dark/40 uppercase tracking-widest">
                        {activeCoachingWaiters} in coaching queue
                      </span>
                    </div>
                    {isCoachingQueued && (
                      <p className="text-xs text-forest-mid font-bold animate-pulse text-center">
                        {coachingStatus}
                      </p>
                    )}
                  </div>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl border border-forest-mid/20 shadow-sm flex flex-col justify-center items-center text-center">
                <h3 className="font-bold text-forest-dark mb-1 text-sm uppercase tracking-wider">Coming Soon</h3>
                <p className="text-forest-dark/60 text-sm font-medium">
                  Specialized learning modules.{" "}<br />
                  <a
                    href="https://www.duolingo.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-forest-mid hover:text-forest-dark font-bold underline transition-colors"
                  >
                    Visit Duolingo for more right now!
                  </a>
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
