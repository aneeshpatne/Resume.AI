from fastapi import FastAPI
import socketio
import chromadb
from openai import OpenAI
from collections import defaultdict

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

chroma_client = chromadb.PersistentClient(path='chroma_db')
collection = chroma_client.get_collection(name="resume_data")
client = OpenAI(base_url="http://localhost:11434/v1",api_key='ollama')

conversation_history = defaultdict(list)

@sio.on("query")
async def handle_query(sid: str, query: str):
    print('Start')
    try:
        results = collection.query(
            query_texts=query,
            n_results=4
        )
        context = ' '.join(results['documents'][0])
        conversation_history[sid].append({"role": "user", "content": query})
        messages = [
            {"role": "system", "content": f"""You are a helpful assistant that answers questions about resumes based on provided context.
            Current context: {context}"""}
        ]
        messages.extend(conversation_history[sid][-5:])
        response = client.chat.completions.create(
            model="deepseek-r1:latest",
            messages=messages,
            stream=True
        )
        complete_response = []
        for chunk in response:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                print(content)
                complete_response.append(content)
                await sio.emit('chunk', content, room=sid)
        conversation_history[sid].append({"role": "assistant", "content":"".join(complete_response)})
        await sio.emit('complete', room=sid)
    except Exception as e:
        await sio.emit('error', str(e), room=sid)
@sio.on('clear_history')
async def clear_history(sid: str):
    conversation_history[sid].clear()
    await sio.emit('history_cleared', room=sid)

@sio.on('disconnect')
async def disconnect(sid: str):
    # Clean up conversation history when client disconnects
    if sid in conversation_history:
        del conversation_history[sid]
app.mount('/', socket_app)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)