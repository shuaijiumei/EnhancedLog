

import pandas as pd
from transformers import AutoTokenizer, AutoModel
import torch

# 加载CodeBERT模型和tokenizer
print("loading model...")
tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
model = AutoModel.from_pretrained("microsoft/codebert-base")

print("start processing...")

# data = pd.read_csv("task1_train.tsv", sep='\t')
data = pd.read_csv("task5_test.tsv", sep='\t')


def get_embedding(code):
    tokens = tokenizer.encode(code, max_length=512, truncation=True, return_tensors='pt')
    context_embeddings = model(tokens)[0]
    mean_embedding = context_embeddings.mean(dim=1).squeeze(0)
    
    return mean_embedding  # 不再转换为数组

# 对每行code进行嵌入处理
embeddings = []
for i, row in data.iterrows():
    # embedding = get_embedding(row["code_mask"])
    embedding = get_embedding(row["code"])
    embedding_array = embedding.detach().numpy().tolist()  # 将张量转换为数组
    embeddings.append(embedding_array)
    print(i)
    # print(embedding_array)


# 添加“embedding”列
data["embedding"] = embeddings

data.to_csv("task5_can.tsv", index=True, sep='\t')

print("done!")



