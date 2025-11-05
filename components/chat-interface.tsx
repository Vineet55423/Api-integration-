"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !apiKey.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const messagesForApi = [
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: input,
        },
      ]

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.href : "",
          "X-Title": "DeepSeek Chat",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: messagesForApi,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.log("[v0] API Error Response:", error)
        throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] API Success Response:", data)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices[0].message.content,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.log("[v0] Caught Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="w-full h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">DeepSeek Chat</h1>
          <p className="text-sm text-muted-foreground mt-1">Powered by OpenRouter</p>
        </div>
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="border-b border-border bg-card/50 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">OpenRouter API Key</label>
                <Input
                  type="password"
                  placeholder="sk-or-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-background border-border text-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get your free API key at{" "}
                  <a
                    href="https://openrouter.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    openrouter.ai
                  </a>
                </p>
              </div>
              <Button
                onClick={() => setShowApiKeyInput(false)}
                disabled={!apiKey.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !showApiKeyInput && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">No messages yet. Start a conversation!</p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`max-w-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                    : "bg-card text-foreground rounded-2xl rounded-tl-sm border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                  {message.role === "assistant" && (
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors text-lg"
                      title="Copy message"
                    >
                      {copiedId === message.id ? "✓" : "📋"}
                    </button>
                  )}
                </div>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card text-foreground rounded-2xl rounded-tl-sm border-border px-4 py-3">
                <span className="text-lg animate-spin inline-block">⏳</span>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      {!showApiKeyInput && (
        <div className="border-t border-border bg-card px-6 py-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
              >
                {isLoading ? "⏳" : "📤"}
              </Button>
              {apiKey && (
                <Button
                  type="button"
                  onClick={() => {
                    setShowApiKeyInput(true)
                    setMessages([])
                  }}
                  variant="outline"
                  className="text-muted-foreground border-border hover:bg-card"
                >
                  Change API Key
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
