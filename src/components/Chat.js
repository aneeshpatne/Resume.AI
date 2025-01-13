'use client';
import { useState, useEffect } from 'react';
import {io} from 'socket.io-client';
let socket;
export default function Chat() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    useEffect(() => {
        socket = io("http://127.0.0.1:5000");
        socket.on("connect", () =>{
            setIsConnected(true);
            console.log("Connected");
        });

        socket.on("disconnect", () =>{
            setIsConnected(false);
            console.log("Disconnected");
        });

        socket.on("stream_chatgpt", (data) => {
            setResponse((prev) => prev + data.response);
        });

        socket.on("error", (data) => {
            console.log(data);
        });
        return () =>{
            if (socket){
                socket.disconnect();
            };

        };
    }, []) 
    const sendQuery =() =>{
        if (query.trim === ''){
            return;
        }
        setResponse("");
        socket.emit("stream_chatgpt", { prompt: query });
        setQuery("");
    }

    return(

        <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>Resume Assistant</h1>
        <div>
            <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question..."
                rows={4}
                style={{ width: "100%", marginBottom: "10px" }}
            />
            <button onClick={sendQuery} style={{ padding: "10px 20px", cursor: "pointer" }}>
                Send
            </button>
        </div>
        <h2>Response:</h2>
        <div
            style={{
                whiteSpace: "pre-wrap",
                border: "1px solid #ccc",
                padding: "10px",
                minHeight: "100px",
            }}
        >
            {response || (isConnected ? "Waiting for response..." : "Not connected to server")}
        </div>
    </div>
);
}