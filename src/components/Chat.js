"use client";

import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Marked from "marked-react";
import { AlertCircle, ChevronDown, ChevronUp, Brain } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingDots } from "@/components/loading-dots";
import { memo } from "react";

let socket;

const SentMessage = memo(function ({ text }) {
  return (
    <div className="flex justify-end mb-2">
      <div className="bg-secondary text-secondary-foreground p-3 rounded-lg max-w-xs">
        {text}
      </div>
    </div>
  );
});

const ReceivedMessage = memo(function ({ text, isStreaming }) {
  const [showThinking, setShowThinking] = useState(false);
  const [thinking, setThinking] = useState("");
  const [processedContent, setProcessedContent] = useState({
    thinking: "",
    cleanText: text,
    hasThinking: false,
  });

  useEffect(() => {
    const startsWithThink = text.trim().startsWith("<think>");
    let thinking = "";
    let cleanText = text;

    if (startsWithThink) {
      setThinking("Thinking...");
      if (text.includes("</think>")) {
        const thinkMatch = text.match(/<think>(.*?)<\/think>/s);
        if (thinkMatch) {
          thinking = thinkMatch[1].trim();
          cleanText = text.replace(/<think>.*?<\/think>/s, "").trim();
        }
        setThinking("Finished Thinking");
      } else {
        thinking = text.replace("<think>", "").trim();
        cleanText = "";
      }
    }

    setProcessedContent({
      thinking,
      cleanText: !startsWithThink ? text : cleanText,
      hasThinking: startsWithThink,
    });
  }, [text]);

  return (
    <div className="flex justify-start mb-2">
      <div className="bg-muted text-white p-3 rounded-lg  w-3/4 m-4">
        {processedContent.hasThinking && (
          <div className="mb-3">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 w-full text-primary hover:text-primary/80 text-sm focus:outline-none bg-secondary/50 p-2 rounded-lg transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span className="flex-1 text-left">{thinking}</span>
              {showThinking ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {showThinking && (
              <div className="mt-2 space-y-2">
                <div className="p-3 bg-secondary rounded-lg text-sm text-secondary-foreground border border-border">
                  {processedContent.thinking}
                </div>
                <div className="text-[10px] text-muted-foreground/60 px-1">
                  How AI thinks about your query and generates a response.
                </div>
              </div>
            )}
          </div>
        )}
        <div className="prose dark:prose-invert">
          <Marked>{processedContent.cleanText}</Marked>
        </div>
      </div>
    </div>
  );
});
const Header = function () {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center space-y-4">
      <div className=" flex items-center justify-center">
        <Brain size={45} />
        <h1 className="text-3xl font-bold text-primary ml-4">Resume.AI</h1>
      </div>
      <div className="text-center text-muted-foreground mt-2">
        Ask me anything about Aneesh Patne's Professional Journey.
      </div>
    </div>
  );
};

const chat = memo(function () {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket = io("http://localhost:8000");

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("chunk", (content) => {
      setCurrentResponse((prev) => prev + content);
      setIsLoading(false);
    });

    socket.on("complete", () => {
      if (currentResponse) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: currentResponse, isSent: false },
        ]);
        setCurrentResponse("");
      }
      setIsLoading(false);
    });

    socket.on("error", (error) => {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Sorry, there was an error processing your request.",
          isSent: false,
        },
      ]);
      setIsLoading(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chunk");
      socket.off("complete");
      socket.off("error");
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse]);

  const sendQuery = () => {
    if (query.trim() === "") return;

    const updatedMessages = [];

    if (currentResponse) {
      updatedMessages.push({
        id: Date.now(),
        text: currentResponse,
        isSent: false,
      });
    }

    updatedMessages.push({
      id: Date.now() + 1,
      text: query,
      isSent: true,
    });

    setMessages((prev) => [...prev, ...updatedMessages]);
    setCurrentResponse("");
    socket.emit("query", query);
    setQuery("");
    setIsLoading(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <div className="flex-grow overflow-y-auto p-4">
        {messages.length === 0 ? <Header /> : null}
        {messages.map((message) =>
          message.isSent ? (
            <SentMessage key={message.id} text={message.text} />
          ) : (
            <ReceivedMessage
              key={message.id}
              text={message.text}
              isStreaming={false}
            />
          )
        )}
        {currentResponse && (
          <ReceivedMessage text={currentResponse} isStreaming={true} />
        )}
        {isLoading && (
          <div className="flex justify-start mb-2">
            <div className="bg-muted text-muted-foreground p-3 rounded-lg">
              <LoadingDots />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 space-y-3 border-t border-border">
        <div className="flex border border-input rounded-lg items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <input
            type="text"
            placeholder="Ask me anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-grow rounded-l-lg p-3 bg-background text-foreground focus:outline-none"
          />
          <button
            onClick={sendQuery}
            className={`px-4 py-3 rounded-r-lg transition-colors ${
              isConnected
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground"
            }`}
            disabled={!isConnected}
          >
            {isConnected ? "Send" : "Connecting..."}
          </button>
        </div>
        <Alert className="bg-secondary/50 border-primary/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-primary/50" />
            <AlertDescription className="text-xs text-muted-foreground">
              Resume.AI may give responses that are not accurate or complete.
              Use with caution. These may not represent the views of Aneesh
              Patne.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    </div>
  );
});
export default chat;
