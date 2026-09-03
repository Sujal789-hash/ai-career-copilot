"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FormattedMarkdown from "@/components/FormattedMarkdown";
import Logo from "@/components/Logo";

type Message = {
  role: "user" | "assistant";
  text: string;
};

interface ConversationItem {
  id: string;
  title: string;
  updatedAt?: unknown;
}

const SUGGESTIONS = [
  "How can I tailor my resume for full-stack developer roles?",
  "What are top 5 System Design concepts I must know?",
  "Suggest practical projects to learn React and Node.js.",
  "How should I prepare for a behavioral interview?",
];

export default function Chat() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);
  const [saveWarning, setSaveWarning] = useState("");
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const loadUserConversations = async (uid: string) => {
    try {
      const q = query(
        collection(db, "users", uid, "conversations"),
        orderBy("updatedAt", "desc")
      );
      const snap = await getDocs(q);
      const list: ConversationItem[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        title: docSnap.data().title || "Untitled Chat",
        updatedAt: docSnap.data().updatedAt,
      }));
      setConversations(list);
    } catch (err) {
      console.error("Error loading conversations list:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        void loadUserConversations(currentUser.uid);
      }
    });

    return unsubscribe;
  }, [router]);

  const selectConversation = async (convId: string) => {
    if (!user || loading) return;
    setConversationId(convId);
    setLoadingHistory(true);
    setError("");

    try {
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "conversations",
        convId,
        "messages"
      );
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const snap = await getDocs(q);
      const loadedMessages: Message[] = snap.docs.map((docSnap) => ({
        role: docSnap.data().role as "user" | "assistant",
        text: docSnap.data().text || "",
      }));
      setMessages(loadedMessages);
      setShowHistoryMobile(false);
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setError("Could not load selected conversation.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewChat = () => {
    setConversationId("");
    setMessages([]);
    setError("");
    setSaveWarning("");
    setShowHistoryMobile(false);
  };

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "conversations", convId));
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (conversationId === convId) {
        startNewChat();
      }
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  };

  const sendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || message).trim();
    if (!queryText || !user || loading) return;

    setMessage("");
    setLoading(true);
    setSaveWarning("");
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          message: queryText,
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let errorMessage = `Unable to generate a response. Please try again.`;
        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text().catch(() => "");
          if (text) {
            console.error("CHAT API non-JSON response:", text.slice(0, 300));
          }
        }
        throw new Error(errorMessage);
      }

      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        console.error("CHAT API non-JSON response:", text.slice(0, 300));
        throw new Error("Unable to generate a response. Please try again.");
      }

      const data = await response.json().catch(() => null);

      if (!data || !data.reply) {
        throw new Error(data?.error || "Unable to generate a response. Please try again.");
      }

      const assistantMessage = data.reply;

      setMessages((previous) => [
        ...previous,
        { role: "user", text: queryText },
        { role: "assistant", text: assistantMessage },
      ]);

      try {
        let currentConversationId = conversationId;

        if (!currentConversationId) {
          const conversationRef = await addDoc(
            collection(db, "users", user.uid, "conversations"),
            {
              title: queryText.slice(0, 60),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }
          );
          currentConversationId = conversationRef.id;
          setConversationId(currentConversationId);
        }

        const messagesRef = collection(
          db,
          "users",
          user.uid,
          "conversations",
          currentConversationId,
          "messages"
        );

        await addDoc(messagesRef, {
          role: "user",
          text: queryText,
          createdAt: serverTimestamp(),
        });

        await addDoc(messagesRef, {
          role: "assistant",
          text: assistantMessage,
          createdAt: serverTimestamp(),
        });

        await updateDoc(
          doc(db, "users", user.uid, "conversations", currentConversationId),
          { updatedAt: serverTimestamp() }
        );

        void loadUserConversations(user.uid);
      } catch (firestoreError) {
        console.error("Firestore save error:", firestoreError);
        setSaveWarning("Response generated successfully, but history could not be saved to cloud.");
      }
    } catch (err) {
      console.error("Gemini error:", err);
      setError(err instanceof Error ? err.message : "Unable to generate a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/60 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span className="font-semibold text-lg tracking-tight text-white">
            Career Copilot
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowHistoryMobile(!showHistoryMobile)}
            className="lg:hidden px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <span>💬</span> History ({conversations.length})
          </button>
          <Link
            href="/dashboard"
            className="hidden sm:inline-block px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/roadmap"
            className="hidden sm:inline-block px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Roadmap
          </Link>
          <Link
            href="/resume"
            className="hidden sm:inline-block px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Resume AI
          </Link>
          <Link
            href="/profile"
            className="hidden sm:inline-block px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace (Left History Sidebar + Right Chat Area) */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        {/* Mobile Backdrop for Sidebar */}
        {showHistoryMobile && (
          <div
            onClick={() => setShowHistoryMobile(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* Left Side: Chat History Panel Box - Docked exactly on the left edge */}
        <aside
          className={`w-72 sm:w-80 bg-zinc-950/95 border-r border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between shrink-0 h-full backdrop-blur-xl transition-all z-40 ${
            showHistoryMobile
              ? "fixed inset-y-0 left-0 shadow-2xl block"
              : "hidden lg:flex"
          }`}
        >
          <div className="flex flex-col h-full justify-between">
            <div>
              {/* Header & New Chat Button */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800/80">
                <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>💬</span> Chat History ({conversations.length})
                </h2>
                <button
                  onClick={startNewChat}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold border border-cyan-500/30 transition-all flex items-center gap-1.5"
                >
                  <span>+</span> New Chat
                </button>
              </div>

              {/* Conversation List */}
              <div className="space-y-1.5 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500 text-xs">
                    No previous chats yet. Start a new conversation!
                  </div>
                ) : (
                  conversations.map((item) => {
                    const isActive = item.id === conversationId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => selectConversation(item.id)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isActive
                            ? "bg-zinc-800/90 border-cyan-500/50 text-white shadow-sm"
                            : "bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-zinc-500">💬</span>
                          <span className="text-xs font-medium truncate">
                            {item.title}
                          </span>
                        </div>

                        <button
                          onClick={(e) => deleteConversation(e, item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity text-xs"
                          title="Delete chat"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 text-center">
              Select any chat to switch conversation view
            </div>
          </div>
        </aside>

        {/* Right Side: Active Conversation */}
        <main className="flex-1 flex flex-col justify-between min-w-0 h-full overflow-hidden bg-zinc-950/40">
          {/* Chat Messages container */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 py-6">
            <div className="max-w-3xl w-full mx-auto">
              {loadingHistory ? (
                <div className="text-center my-auto py-20 text-zinc-400 text-xs flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading conversation messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="mb-6 flex justify-center">
                    <Logo className="w-14 h-14" iconClassName="w-7 h-7" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
                    Ask Career Copilot
                  </h1>
                  <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto mb-8 leading-relaxed">
                    Get personalized advice on technical interviews, resume optimization, architecture concepts, or career strategies.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
                    {SUGGESTIONS.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendMessage(suggestion)}
                        className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-cyan-500/40 text-zinc-300 text-xs font-medium leading-relaxed transition-all hover:bg-zinc-900 shadow-sm"
                      >
                        ✦ {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-2xl sm:max-w-3xl rounded-2xl p-5 shadow-lg ${
                          msg.role === "user"
                            ? "bg-cyan-500 text-zinc-950 rounded-tr-sm font-medium"
                            : "bg-zinc-900/90 border border-zinc-800 text-zinc-100 rounded-tl-sm shadow-xl"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {msg.role === "assistant" ? (
                            <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                              ✦ Career Copilot
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-cyan-950 uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </div>

                        {msg.role === "assistant" ? (
                          <FormattedMarkdown content={msg.text} />
                        ) : (
                          <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-zinc-950">
                            {msg.text}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex items-start">
                      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl rounded-tl-sm p-4 text-zinc-400 text-xs flex items-center gap-3 shadow-lg">
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                        Generating response...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Warnings & Errors */}
          {saveWarning && (
            <div className="max-w-3xl w-full mx-auto px-4 mb-2">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                {saveWarning}
              </div>
            </div>
          )}

          {error && (
            <div className="max-w-3xl w-full mx-auto px-4 mb-2">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent">
            <div className="max-w-3xl w-full mx-auto bg-zinc-900/90 border border-zinc-800/90 backdrop-blur-xl rounded-2xl p-3 shadow-2xl">
              <div className="flex gap-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask a question about your tech career..."
                  rows={2}
                  className="flex-1 bg-transparent border-0 text-white placeholder-zinc-500 text-xs sm:text-sm p-3 resize-none focus:outline-none"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !message.trim() || !user}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-40 self-end"
                >
                  {loading ? "Thinking..." : "Send"}
                </button>
              </div>
              <div className="px-3 pb-1 pt-2 flex justify-between text-[11px] text-zinc-500">
                <span>Enter to send • Shift + Enter for new line</span>
                <span>Powered by Gemini</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-zinc-900 py-3 px-6 text-center text-zinc-500 text-xs">
        <p>© {new Date().getFullYear()} AI Career Copilot</p>
      </footer>
    </div>
  );
}
