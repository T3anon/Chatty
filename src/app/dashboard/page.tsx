"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teacherMatches, setTeacherMatches] = useState([]);
  const [peerMatches, setPeerMatches] = useState([]);
  const [targetLang, setTargetLang] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (session?.user && !(session.user as any).username) {
      router.push("/profile/create");
    }
  }, [status, session, router]);

  const fetchTeacherMatches = async () => {
    if (!targetLang) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/matches/teacher?language=${targetLang}`);
      const data = await res.json();
      setTeacherMatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeerMatches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/matches/peer");
      const data = await res.json();
      setPeerMatches(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {session?.user?.name}</h1>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Teacher-Student Section */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Find a Teacher</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Language you want to learn" 
              className="flex-1 border p-2 rounded text-gray-900"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            />
            <button 
              onClick={fetchTeacherMatches}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
          <div className="space-y-3">
            {teacherMatches.map((t: any) => (
              <div key={t.id} className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{t.name || t.username}</p>
                  <p className="text-xs text-gray-500">Fluent: {t.fluentLanguages}</p>
                </div>
                <button className="text-sm bg-green-500 text-white px-3 py-1 rounded">Chat</button>
              </div>
            ))}
            {teacherMatches.length === 0 && !isLoading && <p className="text-gray-400 text-sm italic">No teachers found yet.</p>}
          </div>
        </div>

        {/* Peer Talk Section */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">1-on-1 Peer Talk</h2>
          <button 
            onClick={fetchPeerMatches}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-4"
          >
            Find Peers
          </button>
          <div className="space-y-3">
            {peerMatches.map((p: any) => (
              <div key={p.id} className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{p.name || p.username}</p>
                  <p className="text-xs text-gray-500">Fluent: {p.fluentLanguages}</p>
                </div>
                <button className="text-sm bg-green-500 text-white px-3 py-1 rounded">Chat</button>
              </div>
            ))}
            {peerMatches.length === 0 && !isLoading && <p className="text-gray-400 text-sm italic">No peers found yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
