import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Upload,
  BookOpen,
  Brain,
  Target,
  TrendingUp,
  Zap,
  X,
  Minimize2,
  Maximize2,
  FileText,
  Code,
  Database,
  Globe,
  Clock,
  CheckCircle,
  Sparkles,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  type?: "text" | "quiz" | "practice" | "progress";
  data?: any;
}

interface StudySparkChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const StudySparkChatbot = ({ isOpen, onClose }: StudySparkChatbotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey! I'm Study Spark, your AI study buddy! 🌟 Ready to ace your BCA journey? What would you like to study today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentTab, setCurrentTab] = useState("chat");
  const [studyProgress] = useState(68);
  const [studyStreak] = useState(7);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const bcaTopics = [
    { name: "Programming in C", icon: Code, progress: 85 },
    { name: "Java & OOP", icon: Code, progress: 72 },
    { name: "Database Management", icon: Database, progress: 68 },
    { name: "Web Development", icon: Globe, progress: 90 },
    { name: "Data Structures", icon: Brain, progress: 75 },
    { name: "Computer Networks", icon: Globe, progress: 55 },
  ];

  const quickActions = [
    { label: "Quiz Me", icon: Brain, action: "quiz" },
    { label: "Study Plan", icon: Clock, action: "plan" },
    { label: "Practice Code", icon: Code, action: "code" },
    { label: "Explain Topic", icon: BookOpen, action: "explain" },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      setIsSending(true);
      const subject = JSON.parse(localStorage.getItem("studySpark_currentSubject") || "null");
      const currentFile = JSON.parse(localStorage.getItem("studySpark_currentFileMeta") || "null");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text,
            })),
            { role: "user", content: userMessage.text },
          ],
          subject: subject || undefined,
          fileId: currentFile?.id || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = (data.content || "").trim();
        if (content) {
          setIsTyping(false);
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: content,
            sender: "ai",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          return;
        }
      }
      throw new Error("No content received");
    } catch (e) {
      setIsTyping(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: `❌ ${e instanceof Error ? e.message : "Unknown error occurred"}. Please check if the server is running.`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  const handleQuickAction = (action: string) => {
    const actionTexts: Record<string, string> = {
      quiz: "Create a quiz for me",
      plan: "Make me a study plan",
      code: "Help me with coding practice",
      explain: "Explain a BCA concept",
    };
    setInputText(actionTexts[action] || "");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "❌ File too large! Please upload a file smaller than 10MB.", sender: "ai", timestamp: new Date() },
      ]);
      return;
    }

    const allowedTypes = ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: "❌ Unsupported file type! Please upload PDF, DOC, DOCX, or TXT files only.", sender: "ai", timestamp: new Date() },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: `📎 Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, sender: "user", timestamp: new Date() },
    ]);

    try {
      setIsUploading(true);
      const form = new FormData();
      form.append("file", file);
      const subject = JSON.parse(localStorage.getItem("studySpark_currentSubject") || "null");
      if (subject) form.append("subject", subject);
      form.append("scope", "user");

      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem("studySpark_currentFileMeta", JSON.stringify({ id: data.id, name: data.name, subject: data.subject }));
      if (Array.isArray(data.questionSuggestions)) {
        localStorage.setItem("studySpark_fileQuestions", JSON.stringify(data.questionSuggestions));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `✅ Successfully uploaded "${file.name}"!\n\nI've analyzed your document:\n• ${(data.questionSuggestions || []).length} study questions extracted\n• Content ready for quiz generation\n\nWhat would you like to explore first?`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `❌ Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setInputText("Help me understand pointers in C programming");
        setIsRecording(false);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-4 sm:right-4 z-50 animate-slide-up">
      <div
        className={`transition-all duration-300 rounded-t-2xl sm:rounded-2xl border border-border/60 bg-card shadow-card-hover overflow-hidden flex flex-col ${
          isMinimized
            ? "w-full sm:w-80 h-16"
            : "w-full sm:w-96 h-[calc(100dvh-env(safe-area-inset-top))] sm:h-[600px]"
        }`}
      >
        {/* ── Header ── */}
        <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Study Spark AI</p>
              <p className="text-[10px] text-white/70 leading-tight">Your BCA Study Buddy</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            >
              {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Body ── */}
        {!isMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-3 mt-3 grid grid-cols-3 h-8 shrink-0">
                <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
                <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
              </TabsList>

              {/* ── Chat Tab ── */}
              <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mx-3 mb-3 mt-2">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.sender === "ai" && (
                        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                          <Sparkles className="h-3 w-3 text-primary" />
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          message.sender === "user"
                            ? "bg-secondary text-secondary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.text}</p>
                        {message.type === "practice" && message.data?.plan && (
                          <div className="mt-2 space-y-1.5">
                            {message.data.plan.map((item: any, index: number) => (
                              <div key={index} className="text-xs bg-primary/10 rounded-lg p-2">
                                <strong className="text-primary">{item.day}:</strong>{" "}
                                <span className="text-foreground">{item.topic}</span>{" "}
                                <span className="text-muted-foreground">({item.duration})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-1.5 my-2.5 shrink-0">
                  {quickActions.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => handleQuickAction(action.action)}
                      className="pill-action flex items-center justify-center gap-1.5 text-xs py-1.5"
                    >
                      <action.icon className="h-3 w-3" />
                      {action.label}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <div className="space-y-2 shrink-0">
                  <div className="flex gap-2">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Ask me anything about BCA…"
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      className="flex-1 h-9 text-sm bg-muted/60 border-border/60 focus:border-primary"
                      aria-label="Chat message input"
                    />
                    <Button
                      onClick={toggleRecording}
                      variant="outline"
                      size="icon"
                      className={`h-9 w-9 shrink-0 ${isRecording ? "bg-destructive/10 border-destructive text-destructive" : "border-border/60"}`}
                      aria-label={isRecording ? "Stop recording" : "Start voice input"}
                    >
                      {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      size="icon"
                      className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"
                      disabled={isSending || !inputText.trim()}
                      aria-label="Send message"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      aria-hidden="true"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-primary border border-dashed border-border/60 hover:border-primary rounded-xl py-2 transition-all duration-150 hover:bg-primary/5"
                      aria-label="Upload study notes"
                    >
                      {isUploading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Upload Notes (PDF, DOC, TXT)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </TabsContent>

              {/* ── Progress Tab ── */}
              <TabsContent value="progress" className="flex-1 overflow-y-auto mx-3 mb-3 mt-2 space-y-4">
                {/* Overall stats */}
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/20 p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{studyProgress}%</p>
                      <p className="text-xs text-muted-foreground">Overall Progress</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-focus">{studyStreak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak 🔥</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${studyProgress}%` }} />
                  </div>
                </div>

                {/* Subject progress */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">BCA Subjects</p>
                  {bcaTopics.map((topic, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <topic.icon className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">{topic.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{topic.progress}%</Badge>
                      </div>
                      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${topic.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* ── Resources Tab ── */}
              <TabsContent value="resources" className="flex-1 overflow-y-auto mx-3 mb-3 mt-2 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: BookOpen, label: "Study Notes" },
                    { icon: Code, label: "Code Library" },
                    { icon: Brain, label: "Practice Tests" },
                    { icon: Target, label: "Career Guide" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="flex items-center gap-2 p-3 rounded-xl border border-border/60 hover:border-primary hover:bg-primary/5 text-xs font-medium text-foreground transition-all duration-150"
                    >
                      <item.icon className="h-4 w-4 text-primary" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-muted/60 p-4 border border-border/60">
                  <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    Today's Goals
                  </p>
                  <div className="space-y-2.5">
                    {[
                      { icon: CheckCircle, text: "Complete C Programming Quiz", done: true },
                      { icon: Clock, text: "Study Java OOP — 1 hour left", done: false },
                      { icon: Target, text: "Practice SQL Queries", done: false },
                    ].map((goal, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <goal.icon className={`h-3.5 w-3.5 shrink-0 ${goal.done ? "text-success" : "text-muted-foreground"}`} />
                        <span className={`text-xs ${goal.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {goal.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySparkChatbot;
