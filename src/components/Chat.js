"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import Marked from "marked-react";
let socket;

// SentMessage Component
function SentMessage({ text }) {
  return (
    <div className="flex justify-end mb-2">
      <div className="bg-sky-500 text-white p-2 rounded-lg max-w-xs">
        {text}
      </div>
    </div>
  );
}

// ReceivedMessage Component
function ReceivedMessage({ text }) {
  return (
    <div className="flex justify-start mb-2">
      <div className="bg-gray-200 text-gray-800 p-2 rounded-lg max-w-xs">
        <Marked>{text}</Marked>
      </div>
    </div>
  );
}

// Chat Component
export default function Chat() {
  const [query, setQuery] = useState(""); // User input
  const [messages, setMessages] = useState([]); // Chat messages
  const [isConnected, setIsConnected] = useState(false); // Socket connection status

  // Socket connection
  useEffect(() => {
    // Initialize the socket connection
    socket = io("http://127.0.0.1:5000");

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected");
    });

    socket.on("stream_chatgpt", (data) => {
      console.log(data);
      setMessages((prevMessages) => {
        if (
          prevMessages.length > 0 &&
          !prevMessages[prevMessages.length - 1].isSent
        ) {
          const lastIndex = prevMessages.length - 1;
          const currentText = prevMessages[lastIndex].text;
          const newText = data.response;

          const updatedMessages = [...prevMessages];
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            text: currentText + newText,
          };

          return updatedMessages;
        } else {
          return [...prevMessages, { text: data.response, isSent: false }];
        }
      });
    });

    socket.on("error", (data) => {
      console.error("Error:", data);
    });

    return () => {
      socket.off("stream_chatgpt", handleMessage);
      socket.disconnect();
    };
  }, []);

  const sendQuery = () => {
    if (query.trim() === "") return;
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: query, isSent: true },
    ]);
    setQuery("");
    socket.emit("stream_chatgpt", { prompt: query });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message, index) =>
          message.isSent ? (
            <SentMessage key={index} text={message.text} />
          ) : (
            <ReceivedMessage key={index} text={message.text} />
          )
        )}
      </div>

      {/* Input Section */}
      <div className="sticky bottom-0 bg-white p-4 border-t">
        <div className="flex border border-gray-300 rounded-lg items-center focus-within:ring-2 focus-within:ring-sky-500">
          <input
            type="text"
            placeholder="Message Resume.AI"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-grow rounded-l-lg p-2 focus:outline-none"
          />
          <button
            onClick={sendQuery}
            className="bg-gray-200 px-4 py-2 rounded-r-lg"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}
