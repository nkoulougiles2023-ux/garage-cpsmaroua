"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { MessageCircle, Send, X, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessages, sendMessage } from "@/lib/actions/chat";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  sender: { id: string; nom: string; prenom: string; role: string };
};

const roleColors: Record<string, string> = {
  ADMIN: "text-red-600",
  CONTROLEUR: "text-blue-600",
  RECEPTIONNISTE: "text-green-600",
  MAGASINIER: "text-orange-600",
  CLIENT: "text-gray-600",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  CONTROLEUR: "Contrôleur",
  RECEPTIONNISTE: "Réception",
  MAGASINIER: "Magasinier",
  CLIENT: "Client",
};

export function ChatPanel({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = () => {
    startTransition(async () => {
      const msgs = await getMessages();
      setMessages(msgs.reverse());
    });
  };

  useEffect(() => {
    if (open && !minimized) {
      loadMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [open, minimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");

    startTransition(async () => {
      const result = await sendMessage(content);
      if (result.data) {
        setMessages((prev) => [...prev, result.data as Message]);
      }
      inputRef.current?.focus();
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Chat équipe</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col rounded-lg border bg-card shadow-xl sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-primary px-4 py-3 rounded-t-lg">
        <div className="flex items-center gap-2 text-primary-foreground">
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-semibold">Chat équipe</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setMinimized(true)}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setOpen(false)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ height: 320 }}>
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aucun message. Commencez la conversation !
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className={`text-[10px] font-semibold ${roleColors[msg.sender.role] || "text-gray-500"}`}>
                    {isMe ? "Vous" : `${msg.sender.prenom} ${msg.sender.nom}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    · {roleLabels[msg.sender.role] || msg.sender.role}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            maxLength={1000}
            disabled={isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isPending}
            className="h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
