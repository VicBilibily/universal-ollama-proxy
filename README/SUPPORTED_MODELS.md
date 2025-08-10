# 🎯 支持的 AI 提供商和模型

本文档详细列出了 Universal Ollama Proxy 支持的所有 AI 提供商和模型。

## 📊 提供商概览

| 提供商             | 模型总数 | 文本生成 | 视觉理解 | 推理思考 | API 密钥获取                                          |
| ------------------ | -------- | -------- | -------- | -------- | ----------------------------------------------------- |
| 🔥 火山方舟引擎    | 12+      | ✅       | ✅       | ✅       | [火山引擎控制台](https://console.volcengine.com/)     |
| 🚀 阿里云百炼      | 8+       | ✅       | ✅       | ❌       | [阿里云控制台](https://dashscope.console.aliyun.com/) |
| 🔥 腾讯云 DeepSeek | 5+       | ✅       | ❌       | ✅       | [腾讯云控制台](https://console.cloud.tencent.com/)    |
| 🎯 DeepSeek 官方   | 2+       | ✅       | ❌       | ✅       | [DeepSeek平台](https://platform.deepseek.com/)        |
| 🌙 Moonshot AI     | 2+       | ✅       | ✅       | ✅       | [Moonshot平台](https://platform.moonshot.cn/)         |
| 🌐 OpenRouter      | 225+     | ✅       | ✅       | ✅       | [OpenRouter平台](https://openrouter.ai/)              |

**模型调用格式**：`provider:model`，例如：`volcengine:doubao-1.5-pro-32k-250115`

---

## 🔥 火山方舟引擎（豆包大模型）

**字节跳动旗下的企业级大模型服务平台**

### 🧠 深度思考模型系列

| 模型名称                 | 模型 ID                                            | 特性                      | 上下文长度 |
| ------------------------ | -------------------------------------------------- | ------------------------- | ---------- |
| 豆包1.5·深度思考 Pro     | `volcengine:doubao-1.5-thinking-pro-250415`        | 🧠 深度推理，复杂问题求解 | 32K        |
| 豆包1.5·视觉深度思考 Pro | `volcengine:doubao-1.5-thinking-vision-pro-250428` | 🧠👁️ 视觉+深度思考        | 32K        |
| 豆包1.5·深度思考 Pro-M   | `volcengine:doubao-1.5-thinking-pro-m-250428`      | 🧠 轻量级深度思考         | 32K        |

### 👁️ 视觉理解模型系列

| 模型名称                 | 模型 ID                                       | 特性                | 上下文长度 |
| ------------------------ | --------------------------------------------- | ------------------- | ---------- |
| 豆包1.5·视觉理解 Pro     | `volcengine:doubao-1.5-vision-pro-250328`     | 👁️ 高精度视觉理解   | 32K        |
| 豆包1.5·视觉理解 Lite    | `volcengine:doubao-1.5-vision-lite-250315`    | 👁️ 轻量级视觉理解   | 32K        |
| 豆包1.5·视觉理解 Pro 32K | `volcengine:doubao-1.5-vision-pro-32k-250115` | 👁️ 大上下文视觉理解 | 32K        |

### 📝 文本生成模型系列

| 模型名称               | 模型 ID                                 | 特性              | 上下文长度 |
| ---------------------- | --------------------------------------- | ----------------- | ---------- |
| 豆包1.5大模型 Pro 32K  | `volcengine:doubao-1.5-pro-32k-250115`  | 📝 高性能文本生成 | 32K        |
| 豆包1.5 Pro 256K       | `volcengine:doubao-1.5-pro-256k-250115` | 📝 超长上下文     | 256K       |
| 豆包1.5大模型 Lite 32K | `volcengine:doubao-1.5-lite-32k-250115` | 📝 快速响应       | 32K        |

### 🤖 DeepSeek 系列（火山代理）

| 模型名称           | 模型 ID                         | 特性                  | 上下文长度 |
| ------------------ | ------------------------------- | --------------------- | ---------- |
| DeepSeek V3-250324 | `volcengine:deepseek-v3-250324` | 🤖 最新版本，性能优化 | 128K       |
| DeepSeek V3        | `volcengine:deepseek-v3-241226` | 🤖 稳定版本           | 128K       |
| DeepSeek R1-0528   | `volcengine:deepseek-r1-250528` | 🧠 最新推理模型       | 128K       |
| DeepSeek R1        | `volcengine:deepseek-r1-250120` | 🧠 推理专用模型       | 128K       |

---

## 🚀 阿里云百炼（通义千问）

**阿里巴巴自研的大语言模型服务平台**

### 📝 文本生成模型系列

| 模型名称            | 模型 ID                       | 特性                    | 上下文长度 |
| ------------------- | ----------------------------- | ----------------------- | ---------- |
| 通义千问 Max        | `dashscope:qwen-max`          | 📝 最强性能（稳定版）   | 128K       |
| 通义千问 Max 最新   | `dashscope:qwen-max-latest`   | 📝 最强性能（最新版）   | 128K       |
| 通义千问 Plus       | `dashscope:qwen-plus`         | 📝 均衡性能（稳定版）   | 128K       |
| 通义千问 Plus 最新  | `dashscope:qwen-plus-latest`  | 📝 均衡性能（最新版）   | 128K       |
| 通义千问 Turbo      | `dashscope:qwen-turbo`        | ⚡ 快速响应（稳定版）   | 128K       |
| 通义千问 Turbo 最新 | `dashscope:qwen-turbo-latest` | ⚡ 快速响应（最新版）   | 128K       |
| 通义千问 Long       | `dashscope:qwen-long`         | 📚 长文本处理（稳定版） | 1M         |
| 通义千问 Long 最新  | `dashscope:qwen-long-latest`  | 📚 长文本处理（最新版） | 1M         |

### 👁️ 视觉理解模型系列

| 模型名称         | 模型 ID                  | 特性                | 上下文长度 |
| ---------------- | ------------------------ | ------------------- | ---------- |
| 通义千问 VL Max  | `dashscope:qwen-vl-max`  | 👁️ 高精度多模态理解 | 128K       |
| 通义千问 VL Plus | `dashscope:qwen-vl-plus` | 👁️ 均衡多模态性能   | 128K       |

---

## 🔥 腾讯云 DeepSeek

**腾讯云托管的 DeepSeek 模型服务**

### 🧠 推理模型系列

| 模型名称         | 模型 ID                      | 特性                | 上下文长度 |
| ---------------- | ---------------------------- | ------------------- | ---------- |
| DeepSeek R1      | `tencentds:deepseek-r1`      | 🧠 强化学习推理模型 | 128K       |
| DeepSeek R1-0528 | `tencentds:deepseek-r1-0528` | 🧠 最新推理模型     | 128K       |

### 📝 文本生成模型系列

| 模型名称           | 模型 ID                        | 特性              | 上下文长度 |
| ------------------ | ------------------------------ | ----------------- | ---------- |
| DeepSeek V3        | `tencentds:deepseek-v3`        | 📝 第三代主力模型 | 128K       |
| DeepSeek V3-0324   | `tencentds:deepseek-v3-0324`   | 📝 优化版本       | 128K       |
| DeepSeek Prover V2 | `tencentds:deepseek-prover-v2` | 🔬 数学证明专用   | 128K       |

---

## 🎯 DeepSeek 官方

**DeepSeek 官方直接提供的模型服务**

### 📝 聊天模型系列

| 模型名称    | 模型 ID                      | 特性                | 上下文长度 |
| ----------- | ---------------------------- | ------------------- | ---------- |
| DeepSeek V3 | `deepseek:deepseek-chat`     | 📝 官方主力聊天模型 | 128K       |
| DeepSeek R1 | `deepseek:deepseek-reasoner` | 🧠 官方推理模型     | 128K       |

---

## 🌙 Moonshot AI（Kimi大模型）

**Moonshot AI 旗下的智能助手Kimi大语言模型平台**

### ️ 多模态模型系列

| 模型名称             | 模型 ID                | 特性                   | 上下文长度 |
| -------------------- | ---------------------- | ---------------------- | ---------- |
| Kimi Latest (Vision) | `moonshot:kimi-latest` | 👁️📝 视觉理解+文本生成 | 128K       |

### 🧠 推理模型系列（Preview）

| 模型名称          | 模型 ID            | 特性                       | 上下文长度 |
| ----------------- | ------------------ | -------------------------- | ---------- |
| Kimi K2 (Preview) | `moonshot:kimi-k2` | 🧠💻 万亿参数推理+代码生成 | 128K       |

### ✨ 特性说明

- **高性能多模态**：kimi-latest 支持图像理解和文本生成
- **前沿推理能力**：K2 模型具备强大的推理和代码生成能力
- **工具调用支持**：支持 Function Calling
- **流式输出**：支持实时流式响应
- **超长上下文**：支持 128K 上下文长度

### 📋 使用要求

- **API 密钥**：需要在 [Moonshot 开放平台](https://platform.moonshot.cn/)
  获取 API Key
- **调用限制**：根据官方限流策略执行
- **计费方式**：按tokens计费，详见官方定价

---

## 🌐 OpenRouter

**多模型聚合服务平台，提供统一接口访问各大 AI 模型**

通过 OpenRouter 平台，可以访问来自全球主要AI厂商的225+个模型，覆盖从免费到顶级的各个层次。

### 🤖 OpenAI 模型系列

| 模型名称        | 模型 ID                               | 特性                  | 上下文长度 |
| --------------- | ------------------------------------- | --------------------- | ---------- |
| GPT-4o          | `openrouter:openai/gpt-4o-2024-11-20` | 🤖 最新 GPT-4o 模型   | 128K       |
| GPT-4o-mini     | `openrouter:openai/gpt-4o-mini`       | ⚡ 轻量级 GPT-4o 模型 | 128K       |
| o3 Preview      | `openrouter:openai/o3`                | 🧠 最新推理专用模型   | 200K       |
| o3-mini         | `openrouter:openai/o3-mini`           | ⚡ 轻量级推理模型     | 128K       |
| o4-mini Preview | `openrouter:openai/o4-mini`           | ⚡ 最新轻量级模型     | 128K       |
| GPT-4.1         | `openrouter:openai/gpt-4.1`           | 🤖 GPT-4 增强版       | 128K       |

### 🎭 Anthropic 模型系列

| 模型名称                   | 模型 ID                                           | 特性                    | 上下文长度 |
| -------------------------- | ------------------------------------------------- | ----------------------- | ---------- |
| Claude 3.5 Sonnet          | `openrouter:anthropic/claude-3.5-sonnet`          | 🎭 均衡性能模型         | 90K        |
| Claude 3.7 Sonnet          | `openrouter:anthropic/claude-3.7-sonnet`          | 🎭 增强版 Sonnet        | 200K       |
| Claude 3.7 Sonnet:thinking | `openrouter:anthropic/claude-3.7-sonnet:thinking` | 🧠✨ 思考推理功能增强版 | 200K       |
| Claude Sonnet 4            | `openrouter:anthropic/claude-sonnet-4`            | 🎭 第四代 Claude        | 80K        |
| Claude Opus 4              | `openrouter:anthropic/claude-opus-4`              | 🎭 最强版本 Claude      | 80K        |

### 🧑‍💻 Google 模型系列

| 模型名称                  | 模型 ID                                               | 特性                | 上下文长度 |
| ------------------------- | ----------------------------------------------------- | ------------------- | ---------- |
| Gemini 2.0 Flash          | `openrouter:google/gemini-2.0-flash-001`              | ⚡ 快速多模态模型   | 1M         |
| Gemini 2.5 Pro            | `openrouter:google/gemini-2.5-pro`                    | 🧑‍💻 高级多模态模型   | 128K       |
| Gemini 2.5 Flash Preview  | `openrouter:google/gemini-2.5-flash-preview`          | ⚡ 预览版快速模型   | 1M         |
| Gemini 2.5 Flash Thinking | `openrouter:google/gemini-2.5-flash-preview:thinking` | 🧠⚡ 思考版快速模型 | 1M         |
| Gemma 3 27B               | `openrouter:google/gemma-3-27b-it`                    | � 开源大模型        | 128K       |
| Gemma 3 12B (free)        | `openrouter:google/gemma-3-12b-it:free`               | 🆓 免费开源模型     | 128K       |

### ⚡ Mistral 模型系列

| 模型名称                  | 模型 ID                                                    | 特性              | 上下文长度 |
| ------------------------- | ---------------------------------------------------------- | ----------------- | ---------- |
| Mistral Large 2411        | `openrouter:mistralai/mistral-large-2411`                  | ⚡ 最新大型模型   | 128K       |
| Mistral Small 3.2 (free)  | `openrouter:mistralai/mistral-small-3.2-24b-instruct:free` | 🆓 免费中型模型   | 128K       |
| Magistral Medium Thinking | `openrouter:mistralai/magistral-medium-2506:thinking`      | 🧠 思考版中型模型 | 128K       |
| Devstral Medium           | `openrouter:mistralai/devstral-medium`                     | 💻 代码专用模型   | 128K       |
| Codestral 2501            | `openrouter:mistralai/codestral-2501`                      | 💻 最新代码生成   | 128K       |
| Pixtral Large 2411        | `openrouter:mistralai/pixtral-large-2411`                  | 👁️ 多模态大模型   | 128K       |

### 🚀 xAI Grok 模型系列

| 模型名称      | 模型 ID                              | 特性              | 上下文长度 |
| ------------- | ------------------------------------ | ----------------- | ---------- |
| Grok 4        | `openrouter:x-ai/grok-4`             | 🚀 最新 Grok 模型 | 128K       |
| Grok 3        | `openrouter:x-ai/grok-3`             | 🚀 第三代模型     | 128K       |
| Grok 3 Mini   | `openrouter:x-ai/grok-3-mini`        | ⚡ 轻量级版本     | 128K       |
| Grok 2 Vision | `openrouter:x-ai/grok-2-vision-1212` | 👁️ 视觉理解版本   | 128K       |

### 🔥 DeepSeek 模型系列

| 模型名称                       | 模型 ID                                                 | 特性                | 上下文长度 |
| ------------------------------ | ------------------------------------------------------- | ------------------- | ---------- |
| DeepSeek R1 (free)             | `openrouter:deepseek/deepseek-r1:free`                  | 🧠🆓 免费推理模型   | 128K       |
| DeepSeek R1                    | `openrouter:deepseek/deepseek-r1`                       | 🧠 强化学习推理     | 128K       |
| DeepSeek V3 (free)             | `openrouter:deepseek/deepseek-chat:free`                | 🆓 免费对话模型     | 128K       |
| DeepSeek V3                    | `openrouter:deepseek/deepseek-chat`                     | 📝 第三代对话模型   | 128K       |
| DeepSeek R1 Distill 14B (free) | `openrouter:deepseek/deepseek-r1-distill-qwen-14b:free` | 🧠🆓 蒸馏版推理模型 | 128K       |

### 📚 Qwen 模型系列

| 模型名称          | 模型 ID                                   | 特性              | 上下文长度 |
| ----------------- | ----------------------------------------- | ----------------- | ---------- |
| Qwen3 235B (free) | `openrouter:qwen/qwen3-235b-a22b:free`    | 🆓 超大免费模型   | 128K       |
| Qwen3 32B (free)  | `openrouter:qwen/qwen3-32b:free`          | 🆓 免费大模型     | 128K       |
| QwQ 32B (free)    | `openrouter:qwen/qwq-32b:free`            | 🧠🆓 免费推理模型 | 128K       |
| Qwen2.5 VL 72B    | `openrouter:qwen/qwen2.5-vl-72b-instruct` | 👁️ 多模态理解模型 | 128K       |
| Qwen-Max          | `openrouter:qwen/qwen-max`                | 📚 最强性能模型   | 128K       |

### 🌙 Moonshot 模型系列

| 模型名称                    | 模型 ID                                           | 特性                  | 上下文长度 |
| --------------------------- | ------------------------------------------------- | --------------------- | ---------- |
| Kimi K2 (free)              | `openrouter:moonshotai/kimi-k2:free`              | 🆓 免费长文本模型     | 1M         |
| Kimi K2                     | `openrouter:moonshotai/kimi-k2`                   | 🌙 高性能长文本       | 1M         |
| Kimi VL A3B Thinking (free) | `openrouter:moonshotai/kimi-vl-a3b-thinking:free` | 🧠👁️🆓 免费多模态思考 | 128K       |

### 🏢 腾讯 Hunyuan 模型系列

| 模型名称                     | 模型 ID                                         | 特性            | 上下文长度 |
| ---------------------------- | ----------------------------------------------- | --------------- | ---------- |
| Hunyuan A13B Instruct (free) | `openrouter:tencent/hunyuan-a13b-instruct:free` | 🆓 免费中文优化 | 128K       |

### 🔤 百度 ERNIE 模型系列

| 模型名称            | 模型 ID                                | 特性            | 上下文长度 |
| ------------------- | -------------------------------------- | --------------- | ---------- |
| ERNIE 4.5 300B A47B | `openrouter:baidu/ernie-4.5-300b-a47b` | 🔤 超大中文模型 | 128K       |

### 🎓 THUDM GLM 模型系列

| 模型名称             | 模型 ID                                 | 特性                | 上下文长度 |
| -------------------- | --------------------------------------- | ------------------- | ---------- |
| GLM Z1 32B (free)    | `openrouter:thudm/glm-z1-32b:free`      | 🆓 免费智谱模型     | 128K       |
| GLM 4 32B (free)     | `openrouter:thudm/glm-4-32b:free`       | 🆓 免费第四代模型   | 128K       |
| GLM 4.1V 9B Thinking | `openrouter:thudm/glm-4.1v-9b-thinking` | 🧠👁️ 多模态思考模型 | 128K       |

---

## � 魔搭社区 (ModelScope)

**阿里云旗下的开源模型社区平台**

> **⚠️ 重要提示**：使用魔搭社区API前，**必须**先在
> [ModelScope官网](https://modelscope.cn/)
> 注册账号并**绑定阿里云账号**。未绑定阿里云账号将导致401认证错误。

### 🧠 Qwen3 思考推理系列

| 模型名称                      | 模型 ID                                         | 特性                  | 上下文长度 |
| ----------------------------- | ----------------------------------------------- | --------------------- | ---------- |
| Qwen3 235B A22B Thinking 2507 | `modelscope:qwen/Qwen3-235B-A22B-Thinking-2507` | 🧠✨ 超大思考推理模型 | 131K       |

### 📝 Qwen3 指令对话系列

| 模型名称                      | 模型 ID                                         | 特性                | 上下文长度 |
| ----------------------------- | ----------------------------------------------- | ------------------- | ---------- |
| Qwen3 235B A22B Instruct 2507 | `modelscope:qwen/Qwen3-235B-A22B-Instruct-2507` | 📝 超大指令调优模型 | 131K       |
| Qwen3 30B A3B Instruct 2507   | `modelscope:qwen/Qwen3-30B-A3B-Instruct-2507`   | 📝 中等指令模型     | 131K       |
| Qwen3 235B A22B Base          | `modelscope:qwen/Qwen3-235B-A22B`               | 📝 超大基础模型     | 131K       |

### � Qwen3 代码生成系列

| 模型名称                       | 模型 ID                                          | 特性                  | 上下文长度 |
| ------------------------------ | ------------------------------------------------ | --------------------- | ---------- |
| Qwen3 Coder 480B A35B Instruct | `modelscope:qwen/Qwen3-Coder-480B-A35B-Instruct` | 💻🔥 超大代码生成模型 | 131K       |
| Qwen3 Coder 30B A3B Instruct   | `modelscope:qwen/Qwen3-Coder-30B-A3B-Instruct`   | 💻 中等代码生成模型   | 131K       |

### 🤖 其他智能模型

| 模型名称 | 模型 ID                      | 特性            | 上下文长度 |
| -------- | ---------------------------- | --------------- | ---------- |
| GLM-4.5  | `modelscope:ZhipuAI/GLM-4.5` | 🤖 智谱AI第四代 | 128K       |

### 🔧 配置要求

1. **注册账号**：在 [ModelScope官网](https://modelscope.cn/) 注册
2. **绑定阿里云**：在个人中心完成阿里云账号绑定（**必需步骤**）
3. **获取密钥**：在个人设置中获取API Token
4. **环境配置**：设置 `MODELSCOPE_API_KEY` 环境变量

---

## 📋 模型选择指南

### 🎯 按用途选择

#### 💼 日常对话和文本生成

- **推荐**：`volcengine:doubao-1.5-pro-32k-250115`、`dashscope:qwen-max`
- **特点**：响应快速，质量稳定，成本适中

#### 🧠 复杂推理和问题解决

- **推荐**：`deepseek:deepseek-reasoner`、`volcengine:doubao-1.5-thinking-pro-250415`
- **特点**：深度思考能力，逻辑推理强

#### 👁️ 图像和多模态理解

- **推荐**：`volcengine:doubao-1.5-vision-pro-250328`、`dashscope:qwen-vl-max`
- **特点**：图像理解准确，多模态交互

#### 📚 长文本处理

- **推荐**：`dashscope:qwen-long`、`volcengine:doubao-1.5-pro-256k-250115`
- **特点**：超长上下文，文档分析能力强

#### ⚡ 快速响应场景

- **推荐**：`dashscope:qwen-turbo`、`volcengine:doubao-1.5-lite-32k-250115`
- **特点**：响应速度快，适合实时应用

### 💰 按成本选择

#### 🆓 成本敏感

- **推荐**：火山方舟引擎 Lite 系列、阿里云 Turbo 系列
- **特点**：价格较低，性能够用

#### 💼 均衡选择

- **推荐**：阿里云 Plus 系列、火山方舟引擎 Pro 系列
- **特点**：性价比高，功能全面

#### 🚀 性能优先

- **推荐**：OpenRouter 高端模型、阿里云 Max 系列
- **特点**：最佳性能，成本较高

### 🔧 集成建议

#### GitHub Copilot Chat 集成

- **首选**：`volcengine:doubao-1.5-pro-32k-250115`
- **备选**：`dashscope:qwen-max`、`deepseek:deepseek-chat`
- **OpenRouter免费选择**：`openrouter:deepseek/deepseek-chat:free`、`openrouter:qwen/qwen3-32b:free`

#### API 开发集成

- **稳定版**：带 `stable` 或不带 `latest` 后缀的模型
- **最新功能**：带 `latest` 后缀的模型
- **免费开发**：OpenRouter 免费模型系列

#### 批量处理场景

- **推荐**：DeepSeek 系列、阿里云 Turbo 系列
- **原因**：并发性能好，成本控制佳
- **免费选择**：OpenRouter 的免费 DeepSeek/Qwen 系列

#### 🆕 2025年更新亮点

##### 🧠 思考推理模型

- **Anthropic**: Claude 3.7 Sonnet:thinking - 支持复杂推理链
- **Google**: Gemini 2.5 Flash:thinking - 快速思考模型
- **Mistral**: Magistral Medium:thinking - 多语言思考支持
- **Moonshot**: Kimi VL A3B:thinking - 多模态思考能力

##### 🆓 免费模型大幅增加

- **DeepSeek**: R1 推理模型免费版本
- **Qwen**: 3系列大部分模型提供免费版本
- **Google**: Gemma 3 系列完全开源免费
- **Mistral**: Small 系列提供免费版本

##### 💻 代码专用模型

- **Mistral**: Devstral/Codestral 系列 - 专业代码生成
- **Qwen**: Coder 系列 - 中文代码优化
- **DeepSeek**: Prover 数学证明专用

---

## 🔄 模型更新说明

### ⚠️ 重要声明

- **动态更新**：模型列表随各供应商实际提供的模型动态变化
- **无保留承诺**：不保证任何模型的永久可用性，供应商可能随时下线模型
- **自行维护**：用户需根据实际需求自行维护和更新所需的模型版本

### 更新机制

- **跟随供应商**：模型配置文件将根据各供应商官方API实际支持情况进行调整
- **版本变更**：模型ID、名称、参数可能因供应商策略调整而改变

### 版本标识说明

- **日期格式**：YYMMDD（如 250115 表示 2025年1月15日）
- **版本号**：v1.5、v3 等表示模型的主要版本
- **后缀说明**：-pro（专业版）、-lite（轻量版）、-latest（最新版）

### 维护责任

- **供应商责任**：各AI服务供应商负责其模型的生命周期管理
- **项目责任**：本项目仅提供技术接口适配，不承担模型可用性保证

---

## 📚 相关文档

- [返回主页](../README.md)
- [详细特性说明](./FEATURES.md)
- [安装指南](./INSTALLATION_GUIDE.md)
- [配置参数详解](./CONFIGURATION.md)
- [开发指南](./DEVELOPMENT.md)
