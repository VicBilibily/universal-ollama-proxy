# 日志中英对照功能说明

## 功能概述

已为项目所有日志输出增加中英对照功能，实现了智能翻译系统，避免误翻译专属变量名。

## 实现特性

### ✅ 智能翻译

- **完整短语优先**：优先匹配更长、更完整的中文短语进行翻译

### ✅ 输出格式

```
11:00:06.780 [INFO] 配置文件监听器已设置（仅监听JSON配置文件）
                    Configuration file watcher set up (JSON config files only)
```

- 中文日志正常输出
- 英文翻译在下一行，与中文消息保持对齐
- 只对包含中文的消息添加英文翻译

### ✅ 动态内容处理

- **路径替换**：自动识别并保留路径信息
- **数字替换**：自动识别并保留数字信息
- **变量保护**：检测可能的变量名模式，避免误翻译

## 实现文件

### 核心文件

1. **`src/utils/logTranslations.ts`** - 翻译映射表和翻译逻辑
2. **`src/utils/logger.ts`** - 日志输出工具，集成中英对照功能

### 主要函数

- `getLogTranslation(message)` - 获取中文消息的英文翻译
- `shouldShowTranslation(message)` - 判断是否需要显示翻译
- `isPossibleVariableName(text)` - 检测可能的变量名，避免误翻译

## 翻译规则

### 包含的翻译类型

- **配置热重载**：配置文件监听、配置变化处理
- **服务初始化**：提供商初始化、模型发现、服务启动
- **请求处理**：请求队列管理、请求执行状态、错误处理
- **文件操作**：日志文件操作、目录创建、文件轮转
- **消息处理**：系统提示词处理、prompt 标签移除
- **错误异常**：网络错误、配置错误、认证失败等
- **状态通知**：构建状态、发布流程、健康检查

### 智能翻译算法

1. **完整匹配优先**：直接匹配完整的日志消息
2. **组合翻译**：智能分解复杂消息，组合多个翻译片段
3. **传统匹配**：模糊匹配包含的关键短语
4. **动态替换**：保留路径、数字等动态内容

### 更新历史

- **2025-06-08**：完善翻译映射表，添加请求队列、消息处理等模块的翻译
- **2025-06-07**：改进翻译算法，支持智能组合翻译，提高复杂消息的翻译准确性
- **2025-06-06**：初始实现中英对照功能，建立基础翻译映射表

## 使用示例

### 简单消息翻译

```
11:10:48.527 [INFO] 已加载消息处理规则配置
                    Message processing rules configuration loaded
```

### 复杂消息组合翻译

```
11:10:48.527 [INFO] 请求队列已满: 100/500，请求可能被延迟
                    Request queue is full: 100/500, requests may be delayed

11:10:48.541 [INFO] 请求 abc123 加入队列，当前队列长度: 150
                    请求 abc123 added to queue, current queue length: 150
```

### 变量名保护

```
11:10:48.545 [INFO] 跳过初始化 TestProvider 提供商，因为它被禁用了
                    Skipping initialization of TestProvider provider, because it is disabled
```

- 文件操作相关消息
- 服务启动和状态消息
- 错误和异常处理消息
- 构建和部署相关消息

### 排除的翻译

- 纯英文消息（无需翻译）
- 单个字符或可能是变量名的短语
- 包含英文变量名的混合语句（避免误翻译变量部分）

## 使用示例

```typescript
import { logger } from './utils/logger';

// 这会输出中英对照
logger.info('配置文件监听器已设置（仅监听JSON配置文件）');
// 输出：
// 11:00:06.780 [INFO] 配置文件监听器已设置（仅监听JSON配置文件）
//                     Configuration file watcher set up (JSON config files only)

// 这不会添加翻译（纯英文）
logger.info('Server started successfully');
// 输出：
// 11:00:06.780 [INFO] Server started successfully

// 这不会错误翻译变量名
logger.info('配置项 item 已更新');
// 会查找最长匹配，避免翻译 "item" 变量名
```

## 扩展翻译

要添加新的翻译，在 `src/utils/logTranslations.ts` 中的 `logTranslations`
对象中添加映射：

```typescript
export const logTranslations: Record<string, string> = {
  // 添加新的翻译
  你的中文消息: 'Your English translation',
  // ...
};
```

**注意事项：**

- 避免添加单个字符的翻译
- 优先添加完整的短语翻译
- 确保翻译准确且专业
