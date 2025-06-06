# 🔧 故障排除指南

本文档提供 Universal Ollama Proxy 常见问题的诊断和解决方案。

## 🚨 常见问题及解决方案

### 🔑 认证相关问题

#### 问题：API Key 认证失败

**错误信息**:

```
Error: Authentication failed - Invalid API key
```

**解决方案**:

1. **检查 .env 文件配置**

   ```bash
   # 确认 API Key 配置格式正确
   cat .env | grep API_KEY
   ```

2. **验证 API Key 有效性**

   ```bash
   # 火山引擎 API Key 测试
   curl -H "Authorization: Bearer $VOLCENGINE_API_KEY" \
        https://ark.cn-beijing.volces.com/api/v3/models

   # 阿里云百炼 API Key 测试
   curl -H "Authorization: Bearer $DASHSCOPE_API_KEY" \
        https://dashscope.aliyuncs.com/api/v1/models
   ```

3. **检查 API Key 权限和额度**

   - 登录对应平台控制台检查余额
   - 确认 API Key 有模型调用权限
   - 检查是否在试用期内

4. **网络连接检查**
   ```bash
   # 测试网络连通性
   ping ark.cn-beijing.volces.com
   ping dashscope.aliyuncs.com
   ```

#### 问题：提示"未找到可用的提供商"

**错误信息**:

```
Error: No available providers found
```

**解决方案**:

1. **确保至少配置一个有效的 API Key**

   ```env
   # .env 文件中至少配置一个
   VOLCENGINE_API_KEY=your_volcengine_api_key_here
   DASHSCOPE_API_KEY=your_dashscope_api_key_here
   ```

2. **运行配置检查**

   ```bash
   npm run check
   ```

3. **查看详细错误日志**

   ```bash
   LOG_LEVEL=debug npm run dev
   ```

4. **检查配置文件**
   ```bash
   # 验证配置文件格式
   node -e "console.log(JSON.parse(require('fs').readFileSync('config/unified-providers.json')))"
   ```

### 🤖 模型相关问题

#### 问题：模型不可用或找不到

**错误信息**:

```
Error: Model 'volcengine:model-name' not found
```

**解决方案**:

1. **确认模型已在对应平台开通**

   - 登录火山引擎控制台检查模型权限
   - 确认模型在当前地区可用

2. **检查模型名称格式**

   ```bash
   # 正确格式：provider:model
   # ✅ 正确
   volcengine:doubao-1.5-pro-32k-250115
   dashscope:qwen-max

   # ❌ 错误
   doubao-1.5-pro-32k-250115  # 缺少提供商前缀
   volcengine/doubao-1.5-pro  # 使用了错误的分隔符
   ```

3. **查看可用模型列表**

   ```bash
   curl http://localhost:11434/api/tags
   ```

4. **检查模型配置文件**
   ```bash
   # 查看模型配置
   cat config/volcengine-models.json | jq '.models[].id'
   ```

#### 问题：模型响应超时

**错误信息**:

```
Error: Request timeout after 30000ms
```

**解决方案**:

1. **检查网络连接稳定性**

   ```bash
   # 测试网络延迟
   ping -c 5 ark.cn-beijing.volces.com

   # 测试DNS解析
   nslookup ark.cn-beijing.volces.com
   ```

2. **增加请求超时时间**

   ```env
   # 在 .env 文件中添加（如果支持）
   REQUEST_TIMEOUT=60000
   ```

3. **确认API服务状态**

   - 查看提供商官方状态页面
   - 检查是否有维护公告

4. **检查API调用频率限制**
   ```bash
   # 降低并发请求数量
   # 增加请求间隔
   ```

### 🌐 网络连接问题

#### 问题：网络请求失败

**错误信息**:

```
Error: Network request failed - ECONNREFUSED
```

**解决方案**:

1. **检查防火墙和代理设置**

   ```bash
   # Windows
   netsh advfirewall show allprofiles

   # Linux
   sudo ufw status

   # 检查代理设置
   echo $HTTP_PROXY
   echo $HTTPS_PROXY
   ```

2. **配置代理（如果需要）**

   ```env
   # .env 文件中添加代理配置
   HTTP_PROXY=http://proxy.company.com:8080
   HTTPS_PROXY=https://proxy.company.com:8080
   ```

3. **验证DNS解析**

   ```bash
   # 测试DNS解析
   nslookup ark.cn-beijing.volces.com
   nslookup dashscope.aliyuncs.com

   # 尝试使用不同的DNS服务器
   nslookup ark.cn-beijing.volces.com 8.8.8.8
   ```

4. **检查目标服务可达性**
   ```bash
   # 测试HTTPS连接
   curl -I https://ark.cn-beijing.volces.com
   curl -I https://dashscope.aliyuncs.com
   ```

### 📁 配置文件问题

#### 问题：配置文件读取失败

**错误信息**:

```
Error: Failed to parse config file - Unexpected token
```

**解决方案**:

1. **检查JSON格式**

   ```bash
   # 使用 jq 验证JSON格式
   cat config/unified-providers.json | jq .

   # 或使用 Node.js 验证
   node -e "JSON.parse(require('fs').readFileSync('config/unified-providers.json'))"
   ```

2. **常见JSON格式错误**

   ```json
   // ❌ 错误：最后一项后有逗号
   {
     "key1": "value1",
     "key2": "value2",
   }

   // ✅ 正确
   {
     "key1": "value1",
     "key2": "value2"
   }

   // ❌ 错误：缺少引号
   {
     key1: "value1"
   }

   // ✅ 正确
   {
     "key1": "value1"
   }
   ```

3. **检查文件权限**

   ```bash
   # Linux/macOS
   ls -la config/
   chmod 644 config/*.json

   # Windows
   icacls config\*.json
   ```

4. **运行配置验证**
   ```bash
   npm run check
   ```

### 📊 日志相关问题

#### 问题：日志文件未生成

**错误信息**:

```
Warning: Chat logs enabled but no log files found
```

**解决方案**:

1. **确认配置正确**

   ```env
   # .env 文件中确认配置
   CHAT_LOGS=true
   CHAT_LOGS_DIR=logs/chat
   ```

2. **检查目录权限和磁盘空间**

   ```bash
   # 检查目录是否存在和权限
   ls -la logs/

   # 检查磁盘空间
   df -h

   # 创建日志目录（如果不存在）
   mkdir -p logs/chat
   chmod 755 logs/chat
   ```

3. **查看主日志错误信息**

   ```bash
   # 启用调试模式查看详细信息
   LOG_LEVEL=debug npm run dev
   ```

4. **测试日志写入权限**
   ```bash
   # 测试写入权限
   echo "test" > logs/chat/test.log
   rm logs/chat/test.log
   ```

#### 问题：无法查看日志内容

**解决方案**:

1. **确认日志文件为有效JSON**

   ```bash
   # 检查日志文件格式
   head -n 5 logs/chat/20250606*.json

   # 验证JSON格式
   cat logs/chat/20250606103015123_abc123def.json | jq .
   ```

2. **使用适当的工具查看**

   ```bash
   # 使用 jq 格式化查看
   cat logs/chat/latest.json | jq '.' | less

   # 使用 VS Code 查看
   code logs/chat/20250606103015123_abc123def.json
   ```

3. **检查文件是否被占用**

   ```bash
   # Linux
   lsof logs/chat/20250606103015123_abc123def.json

   # Windows
   handle logs\chat\20250606103015123_abc123def.json
   ```

## 🛠️ 调试工具和技巧

### 🔍 启用详细调试

```env
# 在 .env 文件中设置详细调试
LOG_LEVEL=debug
CHAT_LOGS=true
CHAT_LOGS_DIR=logs/chat
NODE_ENV=development
```

### 📋 系统诊断步骤

1. **环境检查**

   ```bash
   # 检查 Node.js 版本
   node --version
   npm --version

   # 检查依赖安装
   npm list

   # 检查系统资源
   # Linux/macOS
   free -h && df -h
   # Windows
   systeminfo | findstr "Memory"
   ```

2. **配置验证**

   ```bash
   # 运行完整配置检查
   npm run check

   # 验证环境变量
   node -e "require('dotenv').config(); console.log('Loaded env vars:', Object.keys(process.env).filter(k => k.includes('API_KEY')))"

   # 验证配置文件
   find config -name "*.json" -exec echo "Checking {}" \; -exec jq . {} \;
   ```

3. **网络诊断**

   ```bash
   # 测试所有API端点连通性
   npm run test-all-models-chat

   # 手动测试单个端点
   curl -v https://ark.cn-beijing.volces.com/api/v3/models
   ```

4. **服务状态检查**

   ```bash
   # 检查服务运行状态
   curl -v http://localhost:11434/

   # 检查模型列表
   curl -v http://localhost:11434/api/tags

   # 检查版本信息
   curl -v http://localhost:11434/api/version
   ```

### 📈 性能诊断

#### 内存使用分析

```bash
# 检查内存使用
# Linux
ps aux | grep universal-ollama-proxy
top -p $(pgrep universal-ollama-proxy)

# Windows
tasklist | findstr universal-ollama-proxy
```

#### 网络性能测试

```bash
# 测试API响应时间
time curl -X POST http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "volcengine:doubao-1.5-pro-32k-250115", "messages": [{"role": "user", "content": "Hello"}]}'
```

#### 日志分析

```bash
# 分析错误日志
grep -i error logs/chat/*.json

# 统计请求响应时间
jq '.responseTime' logs/chat/*.json | sort -n

# 分析Token使用
jq '.response.usage.total_tokens' logs/chat/*.json | awk '{sum+=$1} END {print "Average tokens:", sum/NR}'
```

## 🎯 性能优化建议

### 💾 内存优化

1. **定期清理日志文件**

   ```bash
   # 删除7天前的日志
   find logs/chat -name "*.json" -mtime +7 -delete

   # 限制日志文件数量
   ls -t logs/chat/*.json | tail -n +1000 | xargs rm -f
   ```

2. **优化配置**
   ```env
   # 生产环境优化配置
   LOG_LEVEL=warn
   CHAT_LOGS=false
   NODE_ENV=production
   ```

### 🌐 网络优化

1. **使用CDN或就近节点**

   - 选择地理位置最近的API端点
   - 配置负载均衡

2. **优化请求参数**
   ```json
   {
     "max_tokens": 1000, // 限制输出长度
     "temperature": 0.7, // 适中的随机性
     "stream": true // 使用流式响应
   }
   ```

### 🔄 并发优化

1. **控制并发数量**

   - 避免同时发送过多请求
   - 实现请求队列管理

2. **合理的重试策略**
   - 使用指数退避算法
   - 设置最大重试次数

## 🆘 获取帮助

### 📝 报告问题前的准备

1. **收集系统信息**

   ```bash
   # 系统信息
   uname -a
   node --version
   npm --version

   # 服务版本
   curl http://localhost:11434/api/version
   ```

2. **收集错误日志**

   ```bash
   # 启用详细日志
   LOG_LEVEL=debug CHAT_LOGS=true npm run dev

   # 复现问题并收集日志
   # 注意：清除敏感信息（API Keys等）
   ```

3. **准备复现步骤**
   - 详细描述操作步骤
   - 提供最小复现案例
   - 说明预期结果和实际结果

### 📞 联系支持

如果问题仍然存在，请：

1. **GitHub Issues**

   - 前往
     [GitHub Issues](https://github.com/VicBilibily/universal-ollama-proxy/issues)
   - 使用问题模板报告问题
   - 提供详细的环境信息和日志

2. **社区讨论**

   - 参与 GitHub Discussions
   - 查看已知问题和解决方案

3. **提交信息时注意**
   - 🚨 **隐藏敏感信息**：API Keys、密码等
   - 📋 **提供完整信息**：版本、环境、错误日志
   - 🔄 **描述复现步骤**：详细的操作步骤

---

---

## 📚 相关文档

- [返回主页](../README.md)
- [详细特性说明](./FEATURES.md)
- [支持的模型](./SUPPORTED_MODELS.md)
- [安装指南](./INSTALLATION_GUIDE.md)
- [配置参数详解](./CONFIGURATION.md)
- [API 接口文档](./API_REFERENCE.md)
- [开发指南](./DEVELOPMENT.md)
