---
license: other
library_name: peft
tags:
- llama-factory
- lora
- generated_from_trainer
base_model: D:/vscodeProject/EnhancedLog/llama-3-8b-Instruct-bnb-4bit
model-index:
- name: sft
  results: []
---

<!-- This model card has been generated automatically according to the information the Trainer had access to. You
should probably proofread and complete it, then remove this comment. -->

# sft

This model is a fine-tuned version of [D:/vscodeProject/EnhancedLog/llama-3-8b-Instruct-bnb-4bit](https://huggingface.co/D:/vscodeProject/EnhancedLog/llama-3-8b-Instruct-bnb-4bit) on the enhanced_log_train dataset.
It achieves the following results on the evaluation set:
- Loss: 0.9124

## Model description

More information needed

## Intended uses & limitations

More information needed

## Training and evaluation data

More information needed

## Training procedure

### Training hyperparameters

The following hyperparameters were used during training:
- learning_rate: 3e-05
- train_batch_size: 1
- eval_batch_size: 1
- seed: 42
- gradient_accumulation_steps: 8
- total_train_batch_size: 8
- optimizer: Adam with betas=(0.9,0.999) and epsilon=1e-08
- lr_scheduler_type: cosine
- lr_scheduler_warmup_steps: 0.1
- num_epochs: 5.0
- mixed_precision_training: Native AMP

### Training results

| Training Loss | Epoch  | Step | Validation Loss |
|:-------------:|:------:|:----:|:---------------:|
| 0.9235        | 4.4444 | 500  | 0.9124          |


### Framework versions

- PEFT 0.10.0
- Transformers 4.40.1
- Pytorch 2.3.0
- Datasets 2.19.0
- Tokenizers 0.19.1