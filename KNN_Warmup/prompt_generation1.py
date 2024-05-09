"""
input: embedding file of train and test
output: prompt file of test file
"""


from tqdm import tqdm
import pandas as pd
import json
import torch
import numpy as np
import os
import csv
from torch.nn.functional import cosine_similarity
import re
# from embedding_generation1 import DELIMITER


TASK = "task5"


def retrieve(test, train, batch_size, topK, instruct, prompt_delimiter, completion_delimiter):

    train_contexts, train_completions, train_embeddings, train_lineIDs, tasks = zip(
        *train)
    test_contexts, test_completions, test_embeddings, test_lineIDs, tasks = zip(
        *test)

    # 将字符串中的浮点数提取出来，形成嵌套列表
    train_embeddings_array = [eval(embedding_str)
                              for embedding_str in train_embeddings]
    test_embeddings_array = [eval(embedding_str)
                             for embedding_str in test_embeddings]

    # 转换为NumPy数组并指定数据类型
    train_embeddings_np = np.asarray(train_embeddings_array, dtype=np.float)
    test_embeddings_np = np.asarray(test_embeddings_array, dtype=np.float)

    # 转换为PyTorch张量
    train_embeddings = torch.from_numpy(train_embeddings_np).float()
    test_embeddings = torch.from_numpy(test_embeddings_np).float()

    prompts = []
    sims = []
    test_embeddings = test_embeddings.unsqueeze(1)
    for i in tqdm(range(0, len(train_contexts), batch_size)):
        tmp = cosine_similarity(
            test_embeddings, train_embeddings[i:i+batch_size], dim=-1)
        sims.append(tmp)
    sims = torch.cat(sims, 1)
    # print("sims:", sims)
    # print(sims.shape)
    _, indices = sims.topk(topK, dim=1)
    # print(indices.shape)
    for i, q in enumerate(test_contexts):
        top = indices[i]
        examples = []
        for j in top:
            examples.append((train_contexts[j], train_completions[j]))
        # reverse order
        examples.reverse()
        prompt = convert_to_prompt(
            examples, q, instruct, prompt_delimiter, completion_delimiter)
        prompts.append(prompt)

    return prompts


def convert_to_prompt(examples, query, instruct, prompt_delimiter, completion_delimiter):
    prompt_str = ""
    for item in examples:
        prompt_str += f"{prompt_delimiter}{item[0]}\n{completion_delimiter}{item[1]}\n\n"
    if instruct:
        instruct = instruct + '\n\n'
    else:
        instruct = ""
    prompt = f"{'<Instruction>: '}{instruct}{prompt_str}{prompt_delimiter}{query}\n"
    # prompt = f"{prompt_str}{prompt_delimiter}{query}\n"
    return prompt


def read_embedding_tsv(file_path, top_num=None):
    embedding_list = []
    label_list = []
    code_list = []
    lineID_list = []
    task_list = []

    data = pd.read_csv(file_path, sep='\t')

    for i, row in data.iterrows():
        if row["task"] == TASK:
            # task4:
            # code = row["code_mask"]
            # other tasks:
            code = row["code"]

            code_list.append(code)

            label = row["label"]
            label_list.append(label)

            task = row["task"]
            task_list.append(task)

            lineID = row['lineID']
            lineID_list.append(lineID)

            embedding = row["embedding"]
            embedding_list.append(embedding)

        # else:
        #     continue

    return zip(code_list, label_list, embedding_list, lineID_list, task_list)


def get_instruction_by_task(task_name, lineID=None):
    instruction = ""
    # predict line ID of logging statement needed
    if task_name == "task1":
        instruction = "Identify a prospective line index suitable for logging in the given code."
    # predict log level
    if task_name == "task2":
        instruction = "Assign an appropriate log level to replace the 'UNKNOWN' tag."
    # predict log message
    if task_name == "task3":
        instruction = "Infer the missing content of the log message that has been masked as 'UNKNOWN'."
    # given pos, generate logging statement (level,msg)
    if task_name == "task4":
        instruction = "Insert a log statement for the code snippet at the '<mask>' position."
    # generate logging statement (pos,level,msg)
    if task_name == "task5":
        instruction = "Generate a complete log statement with an appropriate line index ahead for the given input code."
    return instruction


def get_retrived_prompts(ori_train_file, ori_test_file, dest_file):

    prompts, metadatas, embeddings, lineID, task = zip(
        *read_embedding_tsv(ori_test_file))
    train = read_embedding_tsv(file_path=ori_train_file)
    test = read_embedding_tsv(file_path=ori_test_file)

    instruction = get_instruction_by_task(TASK, lineID)

    retrieved_prompts = retrieve(test=test, train=train, batch_size=32, topK=5,
                                 instruct=instruction,
                                 prompt_delimiter=' <Example>: ', completion_delimiter=' <Label>: ')

    with open(dest_file, 'w', newline='') as f:
        writer = csv.writer(f, delimiter='\t')
        for p, m, r in zip(prompts, metadatas, retrieved_prompts):
            # line = [r, m, m]
            line = [r, m]
            writer.writerow(line)


if __name__ == '__main__':

    embedding_file_dir = ""
    # embedding_train_file_name = TASK + "_example.tsv"
    # embedding_test_file_name = TASK + "_warmup.tsv"
    # dest_file_path = TASK + "_warmup_icl_3shot.tsv"

    embedding_train_file_name = TASK + "_example.tsv"
    embedding_test_file_name = TASK + "_can.tsv"
    dest_file_path = TASK + "_candidate.tsv"

    get_retrived_prompts(ori_train_file=os.path.join(embedding_file_dir, embedding_train_file_name),
                         ori_test_file=os.path.join(
                             embedding_file_dir, embedding_test_file_name),
                         dest_file=dest_file_path)
