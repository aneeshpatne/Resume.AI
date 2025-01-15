"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
let socket;
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
    <div class="flex flex-col h-screen">
      <div class="sticky bottom-0 bg-white p-4 border-t flex items-center">
        <input
          type="text"
          placeholder="Message Resume.AI"
          class="flex-grow border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
