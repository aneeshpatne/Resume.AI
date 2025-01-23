from fastapi import FastAPI
import socketio
import chromadb
from openai import OpenAI

app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio)

chroma_client = chromadb.PersistentClient(path='chroma_db')
collection = chroma_client.get_collection(name="resume_data")
client = OpenAI(base_url="http://localhost:11434/vi")