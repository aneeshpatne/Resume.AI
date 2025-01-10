from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv()
client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key=os.getenv('OPEN_ROUTER_API_KEY'),
)

completion = client.chat.completions.create(
  model="meta-llama/llama-3.2-3b-instruct:free",
  messages=[
    {
      "role": "user",
      "content": "What is the meaning of life?"
    }
  ]
)
print(completion.choices[0].message.content)