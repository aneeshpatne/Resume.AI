from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="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",
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