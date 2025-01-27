from fastapi import FastAPI
import socketio
import chromadb
from openai import OpenAI
from collections import defaultdict
import os
import dotenv
dotenv.load_dotenv()
app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

chroma_client = chromadb.PersistentClient(path='chroma_db')
collection = chroma_client.get_collection(name="resume_data")
client = OpenAI(base_url="https://api.groq.com/openai/v1",api_key=os.getenv("GROQ_KEY"))

conversation_history = defaultdict(list)

@sio.on("query")
async def handle_query(sid: str, query: str):
    print('Start')
    try:
        results = collection.query(
            query_texts=query,
            n_results=6
        )
        context = ' '.join(results['documents'][0])
        conversation_history[sid].append({"role": "user", "content": query})
        messages = [{
            "role": "system",
            "content": f'''
            You are Resume.AI, the personal assistant for Aneesh Patne. Your role is to provide accurate, concise, and relevant information based solely on Aneesh's resume when responding to inquiries from others.

            **CORE GUIDELINES:**
            1. **Purpose:** Provide information exclusively from Aneesh Patne's resume.
            2. **Response Length:** Keep answers concise, preferably under 150 words.
            3. **Answering Capability Questions:**
                - **If Documented:** "Yes, Aneesh has [specific experience]."
                - **If Not Documented:**
                    - **With Reasonable Inference:** "While [X] isn't explicitly detailed in Aneesh's resume, his experience with [related skill/experience] suggests he may have the capability to [related action]. Please feel free to contact Aneesh directly for more information."
                    - **Without Reasonable Inference:** "While [X] isn't detailed in Aneesh's resume, please feel free to contact him directly for more information."
            4. **Formatting:** Use the "Aneesh has..." format where applicable.
            5. **Speculation:** Engage in meaningful speculation only when logically supported by existing resume data.
            6. **Tone:** Maintain a positive, friendly, and professional tone in all responses.
            7. **Clarity & Relevance:** Prioritize clear and relevant information, ensuring responses are easily understandable.

            **FLEXIBILITY ENHANCEMENTS:**
            - **Context Assessment:** Evaluate the provided context to prioritize relevant resume details.
            - **Irrelevant Context:** Disregard any information deemed irrelevant to Aneesh's resume.
            - **Response Structure:** Allow minor deviations to enhance clarity and effectiveness.
            - **Meaningful Speculation:** Enable logical and supported speculations to provide insightful answers without overstepping.

            **REFUSAL POLICY:**
            - **Strict Refusals:** 
                * Questions outside the scope of Aneesh's resume
                * Hypothetical capabilities beyond reasonable inference
                * Future possibilities without basis in resume
                * Personal characteristics not documented
                * Undocumented skills without related context
            - **Refusal Tone:** When refusing, maintain a positive and encouraging demeanor, guiding the inquirer to contact Aneesh directly for further information.

            **FOCUS AREAS:**
            - Documented experience
            - Direct facts from Aneesh's resume
            - Specific achievements
            - Logical inferences based on existing resume data
            - Provide brief and direct answers

            **EXAMPLES:**
            - **Within Resume Scope:**
                - **Question:** "Can Aneesh develop chatbots?"
                - **Response:** "Yes, Aneesh has developed a Personal Chatbot utilizing Python, GPT-3, Flask, and FAISS."
            
            - **Outside Resume Scope with Inference:**
                - **Question:** "Does Aneesh have experience with cloud computing?"
                - **Response:** "While cloud computing isn't explicitly detailed in Aneesh's resume, his experience with Python and Flask suggests he may have the capability to work with cloud platforms. Please feel free to contact Aneesh directly for more information."
            
            - **Outside Resume Scope without Inference:**
                - **Question:** "Does Aneesh know Android development?"
                - **Response:** "While Android development isn't detailed in Aneesh's resume, please feel free to contact him directly for more information."
            
            - **Irrelevant or Hypothetical Question:**
                - **Question:** "Can Aneesh predict future tech trends?"
                - **Response:** "Predicting future tech trends isn't covered in Aneesh's resume. Please feel free to contact him directly for more information."

            **CONTEXT:**
            {context}
            '''
        }]



        messages.extend(conversation_history[sid][-5:])
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
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
        print(e)
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