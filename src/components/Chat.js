"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
let socket;
function SentMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bg-sky-500 text-white p-2 rounded-lg max-w-xs">
        {text}
      </div>
    </div>
  );
}
function ReceivedMessage({ text }) {
  return (
    <div className="flex">
      <div className="bg-gray-200 text-gray-800 p-2 rounded-lg max-w-xs">
        {text}
      </div>
    </div>
  );
}
export default function Chat() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
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
      setResponse((prev) => prev + data.response);
    });

    socket.on("error", (data) => {
      console.log(data);
    });
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);
  const sendQuery = () => {
    if (query.trim === "") {
      return;
    }
    setResponse("");
    socket.emit("stream_chatgpt", { prompt: query });
    setQuery("");
  };
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto p-4">
        <SentMessage text="Can you explain the projects undertaken my Aneesh?" />
        <ReceivedMessage text="Aneesh has worked on various projects including a chatbot, a web scraper, and a sentiment analysis tool." />
      </div>
      <div className="sticky bottom-0 bg-white p-4 border-t">
        <div
          className="flex border border-gray-300 rounded-lg items-center focus:ring-2 focus:ring-sky-500"
          tabIndex="0"
        >
          <input
            type="text"
            placeholder="Message Resume.AI"
            className="flex-grow rounded-lg p-2 focus:outline-none"
          />
          <button className="bg-gray-200 px-4 py-2 rounded-r-lg">Chat</button>
        </div>
      </div>
    </div>
  );
}
