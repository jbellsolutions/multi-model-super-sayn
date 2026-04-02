"use client";

import { useState, useRef, useEffect } from "react";
import { AGENTS, AgentName } from "@/lib/agents";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agent?: AgentName;
  model?: string;
}

const AGENT_LIST = Object.values(AGENTS);

function shortModel(model: string): string {
  if (model.includes("haiku")) return "Haiku";
  if (model.includes("sonnet")) return "Sonnet";
  if (model.includes("gemini-2.5-pro")) return "Gemini Pro";
  if (model.includes("gemini-2.5-flash")) return "Gemini Flash";
  if (model.includes("gpt-4o")) return "GPT-4o";
  return model;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [routingAgent, setRoutingAgent] = useState<AgentName | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentName | "auto">("auto");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const history = messages.map((m) => ({ role: m.role, content: m.content }));

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);
    setStreamingContent("");
    setRoutingAgent(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          agentName: selectedAgent === "auto" ? undefined : selectedAgent,
          history,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let finalAgent: AgentName = "claude-orchestrator";
      let finalModel = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "routing") {
              finalAgent = event.agent;
              finalModel = event.model;
              setRoutingAgent(event.agent);
            } else if (event.type === "token") {
              accumulated += event.text;
              setStreamingContent(accumulated);
            } else if (event.type === "done") {
              setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: accumulated, agent: finalAgent, model: finalModel },
              ]);
              setStreamingContent("");
              setRoutingAgent(null);
            } else if (event.type === "error") {
              setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: `Error: ${event.message}`, agent: finalAgent },
              ]);
              setStreamingContent("");
              setRoutingAgent(null);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Network error: ${err instanceof Error ? err.message : "unknown"}` },
      ]);
      setStreamingContent("");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-sm font-bold">Super Sayn</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Multi-Model Orchestrator</p>
        </div>
        <div className="p-3 flex flex-col gap-1 flex-1 overflow-y-auto">
          <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1 px-1">Agents</p>
          <button
            onClick={() => setSelectedAgent("auto")}
            className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${selectedAgent === "auto" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800"}`}
          >
            <span className="text-zinc-300 font-medium">Auto Route</span>
            <p className="text-zinc-600 text-[10px] mt-0.5">Intelligent dispatch</p>
          </button>
          {AGENT_LIST.map((agent) => (
            <button
              key={agent.name}
              onClick={() => setSelectedAgent(agent.name)}
              className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${selectedAgent === agent.name ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800"}`}
            >
              <span className={`font-medium ${agent.color}`}>{agent.displayName}</span>
              <p className="text-zinc-600 text-[10px] mt-0.5 leading-tight">{agent.description}</p>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-zinc-800">
          <button onClick={() => setMessages([])} className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors py-1">
            Clear chat
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-zinc-400">
              {selectedAgent === "auto" ? "Auto routing active" : `Locked to ${AGENTS[selectedAgent].displayName}`}
            </span>
          </div>
          {routingAgent && (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className={`text-xs ${AGENTS[routingAgent].color}`}>{AGENTS[routingAgent].displayName} responding...</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.length === 0 && !streaming && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
              <div className="text-4xl">⚡</div>
              <p className="text-zinc-400 text-sm">Multi-Model Super Sayn</p>
              <p className="text-zinc-600 text-xs max-w-xs">
                Chat with your agent team. Auto routing dispatches to the best model — or pick an agent from the sidebar.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2 max-w-sm w-full">
                {[
                  "Analyze the architecture of this project",
                  "Research best practices for multi-agent orchestration",
                  "Review this code for security issues",
                  "Summarize all the agents and their roles",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="text-left text-xs text-zinc-500 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded p-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col gap-1 max-w-3xl ${msg.role === "user" ? "ml-auto items-end" : "items-start"}`}>
              {msg.role === "assistant" && msg.agent && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${AGENTS[msg.agent]?.badge ?? ""}`}>
                    {AGENTS[msg.agent]?.displayName ?? msg.agent}
                  </span>
                  {msg.model && <span className="text-[10px] text-zinc-600">{shortModel(msg.model)}</span>}
                </div>
              )}
              <div className={`px-3 py-2 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-zinc-800 text-zinc-100" : "bg-zinc-900 border border-zinc-800 text-zinc-200"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex flex-col gap-1 max-w-3xl items-start">
              {routingAgent && (
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${AGENTS[routingAgent]?.badge ?? ""}`}>
                    {AGENTS[routingAgent]?.displayName ?? routingAgent}
                  </span>
                </div>
              )}
              <div className="px-3 py-2 rounded-lg text-sm leading-relaxed bg-zinc-900 border border-zinc-800 text-zinc-200 whitespace-pre-wrap min-w-[2rem]">
                {streamingContent}
                <span className="inline-block w-0.5 h-3.5 bg-zinc-400 ml-0.5 animate-pulse align-middle" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-zinc-800 p-4 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={selectedAgent === "auto" ? "Ask anything — will auto-route to best agent..." : `Chat with ${AGENTS[selectedAgent].displayName}...`}
              rows={1}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500 transition-colors"
              style={{ maxHeight: "120px", overflowY: "auto" }}
              disabled={streaming}
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {streaming ? "..." : "Send"}
            </button>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1.5">Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  );
}
