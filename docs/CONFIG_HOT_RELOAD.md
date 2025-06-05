# 配置热重载功能说明

## 概述

本项目实现了 JSON 配置文件的自动热重载功能，使得在服务运行期间修改配置文件时，无需重启服务即可生效。

**注意**: 此功能仅支持 JSON 配置文件的热重载，环境变量 (`.env`
文件) 的更改需要手动重启服务。

## 支持的配置文件

### 1. 统一提供商配置

- **文件路径**: `config/unified-providers.json`
- **监听类型**: 文件变化
- **重载行为**:
  - 重新初始化所有AI提供商客户端
  - 更新统一适配器服务配置
  - 替换环境变量占位符

### 2. 消息处理规则配置

- **文件路径**: `config/message-processing-rules.json`
- **监听类型**: 文件变化
- **重载行为**: 重新加载聊天日志配置

### 3. 模型配置文件

- **文件路径**: `config/*-models.json`
- **监听类型**: 文件变化
- **重载行为**: 重新加载指定提供商的模型配置

## 功能特性

### 防抖处理

- 配置文件变化后有 1 秒的防抖延迟
- 避免频繁的文件变化导致多次重载

### 错误处理

- 配置重载失败时不会影响服务运行
- 详细的错误日志记录
- 自动跳过无效的配置文件

### 事件通知

- 配置变化时发出事件通知
- 相关服务可订阅配置变化事件
- 支持手动触发配置重载

## 使用方法

### 自动启用

配置热重载功能在应用启动时自动启用，无需额外配置。

### 手动控制

```typescript
import { configHotReload } from './services/configHotReload';

// 启用热重载
configHotReload.enable();

// 禁用热重载
configHotReload.disable();

// 手动触发重载
await configHotReload.manualReload();

// 获取状态
const status = configHotReload.getStatus();
console.log('热重载状态:', status);
```

### 监听配置变化事件

```typescript
import { configHotReload } from './services/configHotReload';
import { configManager } from './config';

// 监听配置文件变化
configHotReload.on('configChanged', event => {
  console.log('配置文件已更新:', event.filePath);
});

// 监听配置项更新
configManager.on('configUpdated', ({ key, oldValue, newValue }) => {
  console.log(`配置项 ${key} 已更新:`, { oldValue, newValue });
});
```

## 日志输出

配置热重载功能会产生以下类型的日志：

### 启动日志

```
[INFO] 配置热重载已启用 (仅支持JSON配置文件)
[INFO] 配置文件监听器已设置
[DEBUG] 开始监听目录: /path/to/config
```

### 变化检测日志

```
[INFO] 检测到配置文件变化: /path/to/config/unified-providers.json
[INFO] 配置文件已更新: /path/to/config/unified-providers.json
[INFO] 处理JSON配置文件变化: unified-providers
```

### 重载成功日志

```
[INFO] 配置重载成功: /path/to/config/unified-providers.json
[INFO] 统一提供商配置已更改，重新初始化相关服务
[INFO] 统一适配器服务配置已更新
```

### 错误日志

```
[ERROR] 配置重载失败 /path/to/config/invalid.json: SyntaxError: Unexpected token
[ERROR] 处理JSON配置文件变化失败: Error message
```

## 测试热重载功能

### 使用测试脚本

```bash
# 运行热重载测试脚本
node scripts/test-config-hot-reload.js
```

### 手动测试步骤

1. **启动应用**

   ```bash
   npm run dev
   ```

2. **修改统一提供商配置**

   编辑
   `config/unified-providers.json`，添加或修改提供商配置。观察统一适配器服务重新初始化。

3. **修改模型配置**

   编辑任意 `config/*-models.json` 文件。观察模型发现服务重新加载。

**注意**: 环境变量 (`.env` 文件) 的更改现在需要手动重启服务才能生效。

## 性能考虑

### 监听范围

- 只监听 `config/` 目录下的 JSON 文件
- 最大监听深度为 2 层目录
- 环境变量文件 (`.env`) 不再支持热重载

### 资源消耗

- 使用 chokidar 库进行高效的文件监听
- 防抖机制减少不必要的重载操作
- 惰性加载，只在配置变化时执行重载

### 内存管理

- 正确清理文件监听器
- 应用关闭时自动停止配置热重载服务

## 故障排除

### 常见问题

1. **配置热重载不生效**

   - 检查文件权限
   - 确认文件路径正确
   - 查看错误日志

2. **频繁重载**

   - 检查是否有其他程序在修改配置文件
   - 确认防抖延迟设置 (默认 1 秒)

3. **配置重载失败**
   - 检查 JSON 语法是否正确
   - 查看详细错误信息

### 调试方法

1. **启用调试日志**

   ```bash
   export LOG_LEVEL=debug
   npm run dev
   ```

2. **检查监听状态**

   ```typescript
   const status = configHotReload.getStatus();
   console.log('监听状态:', status);
   ```

3. **手动触发重载**
   ```typescript
   await configHotReload.manualReload();
   ```

## 限制和注意事项

### 配置项限制

- 环境变量 (如端口号) 更改需要重启服务才能生效
- 某些系统级配置变更可能需要重启

### 文件格式要求

- JSON 配置文件必须符合标准格式

### 并发安全

- 配置重载过程中的请求仍使用旧配置
- 新配置加载完成后立即生效

## 扩展开发

### 添加新的配置文件类型

1. 在 `handleJsonConfigChange` 方法中添加新的文件类型处理
2. 实现对应的重载逻辑
3. 添加相应的事件监听器

### 自定义重载行为

1. 监听 `configChanged` 事件
2. 根据配置文件类型执行自定义逻辑
3. 使用配置管理器更新配置状态

---

此功能专注于 JSON 配置文件的热重载，大大提高了开发和运维效率，使得配置调整变得更加便捷和安全。对于环境变量的更改，请重启服务以确保更改生效。
