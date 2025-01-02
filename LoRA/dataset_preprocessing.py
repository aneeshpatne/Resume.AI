import json
import sys

def transform_line(line):
    data = json.loads(line.strip())
    question = data["question"]
    answer   = data["answer"]
    return {
        "instruction": question,
        "input": "",
        "output": answer
    }

if __name__ == "__main__":
    input_file = "resume_chatbot_training_data_full.jsonl"
    output_file = "dataset.jsonl"
    
    with open(input_file, "r") as fin, open(output_file, "w") as fout:
        for line in fin:
            sample = transform_line(line)
            fout.write(json.dumps(sample) + "\n")
