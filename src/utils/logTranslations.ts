/**
 * 日志消息中英对照翻译映射表
 * 用于为中文日志消息提供英文翻译
 */

export const logTranslations: Record<string, string> = {
  // 配置热重载相关
  '配置文件监听器已设置（仅监听JSON配置文件）': 'Configuration file watcher set up (JSON config files only)',
  '配置热重载已启用（仅支持JSON配置文件）': 'Configuration hot reload enabled (JSON config files only)',
  配置热重载已禁用: 'Configuration hot reload disabled',
  '配置热重载服务已初始化（仅支持JSON配置文件）':
    'Configuration hot reload service initialized (JSON config files only)',
  '配置热重载错误:': 'Configuration hot reload error:',
  所有配置已重新加载: 'All configurations reloaded',
  配置热重载服务已销毁: 'Configuration hot reload service destroyed',
  所有文件监听器已停止: 'All file watchers stopped',

  // 配置文件变化相关
  '配置文件已更新:': 'Configuration file updated:',
  '配置文件已删除:': 'Configuration file deleted:',
  '配置项已更新:': 'Configuration item updated:',
  '检测到配置文件变化:': 'Configuration file change detected:',
  '配置文件变化事件触发:': 'Configuration file change event triggered:',
  '处理JSON配置文件变化失败:': 'Failed to handle JSON config file change:',
  '处理JSON配置文件删除失败:': 'Failed to handle JSON config file deletion:',
  '处理配置更新失败:': 'Failed to handle configuration update:',
  '重载 JSON 配置文件失败:': 'Failed to reload JSON config file:',
  '清除之前的防抖定时器:': 'Clearing previous debounce timer:',
  '防抖定时器触发，开始处理配置变化:': 'Debounce timer triggered, starting to handle configuration change:',
  'JSON 配置文件已重新加载:': 'JSON configuration file reloaded:',

  // 提供商配置相关
  '统一提供商配置已更改，重新初始化相关服务': 'Unified provider configuration changed, reinitializing related services',
  统一适配器服务配置已更新: 'Unified adapter service configuration updated',
  '消息处理规则配置已更改，重新加载日志配置':
    'Message processing rules configuration changed, reloading log configuration',
  聊天日志配置已重新加载: 'Chat log configuration reloaded',
  '提供商模型配置文件已删除，将使用默认配置':
    'Provider model configuration file deleted, will use default configuration',

  // 端口和服务相关
  '端口配置已更改，需要重启服务才能生效': 'Port configuration changed, service restart required to take effect',
  '服务器已启动，端口:': 'Server started on port:',
  '收到 SIGTERM 信号，准备关闭服务器...': 'Received SIGTERM signal, preparing to shutdown server...',
  '收到 SIGINT 信号，准备关闭服务器...': 'Received SIGINT signal, preparing to shutdown server...',
  '🚀 Ollama 兼容服务器启动成功，监听端口': '🚀 Ollama compatible server started successfully, listening on port',
  '🔍 健康检查:': '🔍 Health check:',
  '🤖 已加载': '🤖 Loaded',

  // 用户操作和请求处理相关
  用户登录成功: 'User login successful',
  请求处理完成: 'Request processing completed',
  连接失败: 'Connection failed',
  连接数据库失败: 'Database connection failed',
  '配置文件不存在，使用默认配置': 'Configuration file does not exist, using default configuration',
  配置文件丢失: 'Configuration file missing',

  // API Key 获取相关 - 完整短语翻译
  '提供商的 API Key': 'provider API Key',
  火山方舟引擎: 'Volcengine Ark',
  阿里云百炼: 'Alibaba Cloud Dashscope',
  DeepSeek官方: 'DeepSeek Official',
  腾讯云DeepSeek: 'Tencent Cloud DeepSeek',

  // 提供商和模型相关
  '过滤后可用的提供商:': 'Available providers after filtering:',
  '已注册的模型总览:': 'Registered models overview:',

  // 服务初始化相关
  聊天日志已初始化: 'Chat log initialized',
  '工具修复服务已初始化（简化版本，只包含 Anthropic/Claude 修复）':
    'Tool repair service initialized (simplified version, Anthropic/Claude repair only)',
  已更新可用提供商列表: 'Updated available providers list',
  已更新模型发现服务的可用提供商列表: 'Updated available providers list for model discovery service',
  统一适配器服务初始化完成: 'Unified adapter service initialization completed',
  配置热重载服务已关联服务实例: 'Configuration hot reload service linked to service instances',
  '=== 服务初始化完成，输出可用模型信息 ===':
    '=== Service initialization completed, outputting available model information ===',

  // 请求处理相关
  '请求处理错误:': 'Request processing error:',
  '开始处理请求:': 'Starting to process request:',
  '检测到大请求: ${sizeInMB}MB，路径: ${req.path}，方法: ${req.method}':
    'Large request detected: ${sizeInMB}MB, path: ${req.path}, method: ${req.method}',
  显示Ollama格式模型信息: 'Displaying Ollama format model information',
  '通过统一适配器处理 OpenAI 聊天请求': 'Processing OpenAI chat request through unified adapter',

  // 聊天日志相关
  '创建聊天日志目录失败:': 'Failed to create chat log directory:',
  '写入聊天日志失败:': 'Failed to write chat log:',

  // 文件操作相关
  '创建日志目录失败:': 'Failed to create log directory:',
  '写入日志文件失败:': 'Failed to write log file:',
  '日志文件轮转失败:': 'Log file rotation failed:',
  '日志文件已轮转，大小:': 'Log file rotated, size:',
  '获取日志文件大小失败:': 'Failed to get log file size:',

  // 未捕获异常相关
  '未捕获异常:': 'Uncaught exception:',
  '未处理的 Promise 拒绝:': 'Unhandled promise rejection:',

  // 目录监听相关
  '开始监听目录:': 'Started watching directory:',
  目录监听错误: 'Directory watching error',
  '设置防抖定时器:': 'Setting debounce timer:',
  '清除删除文件的防抖定时器:': 'Clearing debounce timer for deleted file:',

  // 消息处理规则相关
  已加载消息处理规则配置: 'Message processing rules configuration loaded',
  '加载消息处理规则配置失败，使用默认配置':
    'Failed to load message processing rules configuration, using default configuration',
  '处理消息处理规则变化失败:': 'Failed to handle message processing rules change:',

  // 通用消息（只保留完整短语翻译）
  配置项已更新: 'Configuration item updated',
  '配置文件不存在，可能已被删除:': 'Configuration file does not exist, may have been deleted:',
  '未知的配置文件类型:': 'Unknown configuration file type:',
  '未知的配置文件被删除:': 'Unknown configuration file deleted:',

  // 构建和脚本相关
  '所有平台构建完成!': 'All platform builds completed!',
  '输出目录:': 'Output directory:',
  '验证过程中发生错误:': 'Error occurred during validation:',
  发布流程验证: 'Release process validation',

  // 模型测试相关
  '详细报告已保存到:': 'Detailed report saved to:',
  'Markdown报告已保存到:': 'Markdown report saved to:',
  '保存报告失败:': 'Failed to save report:',

  // GitHub Actions 相关
  工作流运行状态: 'Workflow run status',
  '本地 CI/CD 状态': 'Local CI/CD status',
  '二进制文件:': 'Binary files:',
  '发布包:': 'Release packages:',
  目录不存在: 'Directory does not exist',

  // 环境和配置
  '项目名称:': 'Project name:',
  '版本:': 'Version:',
  '描述:': 'Description:',
  '可用命令:': 'Available commands:',
  '提示:': 'Tip:',

  // 时间和状态
  '时间戳格式:': 'Timestamp format:',
  '示例文件名:': 'Example filename:',
  '文件命名格式:': 'File naming format:',
  '日志目录:': 'Log directory:',

  // 请求队列相关 - 变量插值格式
  '请求队列已满: ${queueLength}/${queueLimit}，请求可能被延迟':
    'Request queue is full: ${queueLength}/${queueLimit}, requests may be delayed',
  '请求 ${id} 加入队列，当前队列长度: ${queueLength}':
    'Request ${id} added to queue, current queue length: ${queueLength}',
  '开始执行请求 ${itemId}，等待时间: ${waitTime}ms': 'Starting to execute request ${itemId}, wait time: ${waitTime}ms',
  '请求 ${itemId} 完成，执行时间: ${duration}ms': 'Request ${itemId} completed, execution time: ${duration}ms',
  '请求 ${itemId} 失败: ${errorMessage}': 'Request ${itemId} failed: ${errorMessage}',

  // 消息处理规则相关 - 变量插值格式
  已修改系统提示词: 'System prompt modified',
  '已移除 prompt 标签': 'Removed prompt tags',
  '已加载消息处理规则配置，规则数量: ${rulesLength}':
    'Message processing rules configuration loaded, rules count: ${rulesLength}',
  '加载消息处理规则配置失败，使用默认配置: ${errorMessage}':
    'Failed to load message processing rules configuration, using default config: ${errorMessage}',
  '已修改系统提示词，原长度: ${originalLength}，处理后长度: ${processedLength}':
    'System prompt modified, original length: ${originalLength}, processed length: ${processedLength}',
  '已移除 prompt 标签，原长度: ${originalLength}，处理后长度: ${strippedLength}':
    'Removed prompt tags, original length: ${originalLength}, stripped length: ${strippedLength}',

  // 错误和异常处理
  内部服务器错误: 'Internal server error',
  请求超时: 'Request timeout',
  网络错误: 'Network error',
  配置错误: 'Configuration error',
  认证失败: 'Authentication failed',
  权限不足: 'Insufficient permissions',
  '工具修复服务出错，使用原始工具': 'Tool repair service error, using original tools',

  // 脚本和测试相关
  '测试模型:': 'Testing model:',
  '回复:': 'Reply:',
  '测试过程中发生错误:': 'Error occurred during testing:',
  '🧪 测试模型:': '🧪 Testing model:',
  '✅': '✅',
  '❌': '❌',
  '⚠️  没有找到可用的模型': '⚠️  No available models found',
  '💥 测试过程中发生错误:': '💥 Error occurred during testing:',
  '🎯 AI 模型统一代理 - 模型测试工具': '🎯 Universal AI Model Proxy - Model Testing Tool',
  '🌐 服务地址:': '🌐 Service URL:',
  '💬 测试消息:': '💬 Test message:',
  '⏱️  超时时间:': '⏱️  Timeout:',
  秒: 'seconds',
  '🔄 最大并发:': '🔄 Max concurrent:',

  // 构建和部署相关
  '请输入选项编号:': 'Please enter option number:',
  '👋 再见！': '👋 Goodbye!',
  '❌ 无效的选项，请重新选择': '❌ Invalid option, please choose again',
  '按回车键继续...': 'Press Enter to continue...',
  '执行:': 'Executing:',

  // 聊天处理相关
  统一聊天请求失败: 'Unified chat request failed',
  流式聊天处理失败: 'Streaming chat processing failed',
  非流式聊天处理失败: 'Non-streaming chat processing failed',

  // 工具修复相关
  工具修复警告: 'Tool repair warning',
  工具修复错误: 'Tool repair error',
  已移除的工具: 'Removed tools',

  // 构建相关
  构建成功: 'Build successful',
  构建失败: 'Build failed',
  编译完成: 'Compilation complete',
  测试通过: 'Tests passed',
  测试失败: 'Tests failed',

  // 模型发现服务相关 - 变量插值格式
  '模型发现服务初始化完成，共加载 ${size} 个模型': 'Model discovery service initialized, loaded ${size} models',
  '加载 ${providerName} 模型配置失败:': 'Failed to load ${providerName} model configuration:',
  '配置文件不存在: ${filePath}': 'Configuration file does not exist: ${filePath}',
  '成功加载 ${provider} 提供商的 ${enabledCount} 个启用模型（总共 ${totalCount} 个模型）':
    'Successfully loaded ${enabledCount} enabled models from ${provider} provider (total ${totalCount} models)',
  '解析 ${providerName} 模型配置失败:': 'Failed to parse ${providerName} model configuration:',
  '模型 ${model} 所属的提供商 ${provider} 不可用': 'Model ${model} belongs to unavailable provider ${provider}',
  '已更新可用提供商列表: ${providerListText}，数量: ${count}':
    'Updated available providers list: ${providerListText}, count: ${count}',
  '已重新加载 ${provider} 提供商的模型配置': 'Reloaded model configuration for ${provider} provider',
  '重新加载 ${provider} 提供商模型配置失败:': 'Failed to reload ${provider} provider model configuration:',
  '已注册的模型总览: ${providerCount} 个提供商，共 ${modelCount} 个模型':
    'Registered models overview: ${providerCount} providers, total ${modelCount} models',
  '[${providerName}] ${count} 个模型:': '[${providerName}] ${count} models:',
  '  ${names}': '  ${names}',
  '已移除 ${provider} 提供商的 ${count} 个模型': 'Removed ${count} models from ${provider} provider',
  '重新加载 ${providerName} 模型配置失败:': 'Failed to reload ${providerName} model configuration:',

  // 配置重载服务相关 - 变量插值格式
  '配置文件已更新: ${filePath}，类型: ${type}，时间戳: ${timestamp}':
    'Configuration file updated: ${filePath}, type: ${type}, timestamp: ${timestamp}',
  '配置项已更新: ${configKey}，旧值: ${oldVal}，新值: ${newVal}':
    'Configuration item updated: ${configKey}, old value: ${oldVal}, new value: ${newVal}',
  '配置文件已删除: ${filePath}，类型: ${type}，时间戳: ${timestamp}':
    'Configuration file deleted: ${filePath}, type: ${type}, timestamp: ${timestamp}',
  '处理JSON配置文件变化: ${fileName}': 'Processing JSON configuration file change: ${fileName}',
  '处理JSON配置文件删除: ${fileName}': 'Processing JSON configuration file deletion: ${fileName}',
  '端口配置已更改，需要重启服务才能生效，旧端口: ${oldValue}，新端口: ${newValue}':
    'Port configuration changed, service restart required, old port: ${oldValue}, new port: ${newValue}',
  '环境变量 ${envVariable} 未设置，${displayName} 提供商将不可用':
    'Environment variable ${envVariable} not set, ${displayName} provider will be unavailable',
  '从环境变量 ${envVariable} 获取 ${displayName} 提供商的 API Key':
    'Getting ${displayName} provider API Key from environment variable ${envVariable}',
  '使用配置文件中的配置密钥配置 ${displayName} 提供商':
    'Configuring ${displayName} provider using configuration file key',
  '${displayName} 提供商不需要认证，使用空 API Key':
    '${displayName} provider requires no authentication, using empty API Key',
  '热重载过滤后可用的提供商: ${availableProviders}':
    'Available providers after hot reload filtering: ${availableProviders}',
  '已更新模型发现服务的可用提供商列表: ${providerList}':
    'Updated model discovery service available providers list: ${providerList}',
  '聊天日志配置已重新加载，启用状态: ${chatLogger.isEnabled()}，配置: ${JSON.stringify(config)}':
    'Chat log configuration reloaded, enabled status: ${chatLogger.isEnabled()}, config: ${JSON.stringify(config)}',
  '${providerName} 提供商模型配置已更改，重新加载模型配置':
    '${providerName} provider model configuration changed, reloading model configuration',
  '${providerName} 提供商模型配置重新加载完成': '${providerName} provider model configuration reload completed',
  '=== ${providerName} 提供商配置更新完成，输出可用模型信息 ===':
    '=== ${providerName} provider configuration update completed, outputting available model information ===',
  '${providerName} 提供商模型配置文件已删除，将使用默认配置':
    '${providerName} provider model configuration file deleted, will use default configuration',
  '未知的配置文件类型: ${fileName}': 'Unknown configuration file type: ${fileName}',
  '未知的配置文件被删除: ${fileName}': 'Unknown configuration file deleted: ${fileName}',
  '配置项 ${configKey} 已更新，旧值: ${oldVal}，新值: ${newVal}':
    'Configuration item ${configKey} updated, old value: ${oldVal}, new value: ${newVal}',

  // 统一适配器相关 - 变量插值格式
  '跳过初始化 ${displayName} 提供商，因为它被禁用了':
    'Skipping initialization of ${displayName} provider because it is disabled',
  '初始化${displayName}提供商成功，提供商: ${providerName}，baseURL: ${baseURL}':
    'Successfully initialized ${displayName} provider, provider: ${providerName}, baseURL: ${baseURL}',
  '初始化${displayName}提供商失败，提供商: ${providerName}，错误: ${errorMessage}':
    'Failed to initialize ${displayName} provider, provider: ${providerName}, error: ${errorMessage}',
  '统一聊天请求失败，requestId: ${requestId}，model: ${model}，错误: ${errorMessage}':
    'Unified chat request failed, requestId: ${requestId}, model: ${model}, error: ${errorMessage}',
  '工具修复警告，model: ${model}，警告: ${warningsText}，触发规则: ${rulesText}':
    'Tool repair warning, model: ${model}, warnings: ${warningsText}, triggered rules: ${rulesText}',
  '工具修复错误，model: ${model}，错误: ${errorsText}，触发规则: ${rulesText}':
    'Tool repair error, model: ${model}, errors: ${errorsText}, triggered rules: ${rulesText}',
  '已移除的工具，model: ${model}，移除数量: ${removedCount}，移除工具: ${removedToolsText}':
    'Removed tools, model: ${model}, removed count: ${removedCount}, removed tools: ${removedToolsText}',
  '工具修复服务出错，使用原始工具，模型: ${model}，错误: ${errorMessage}，工具数量: ${toolsCount}':
    'Tool repair service error, using original tools, model: ${model}, error: ${errorMessage}, tools count: ${toolsCount}',
  开始更新统一适配器配置: 'Starting to update unified adapter configuration',
  '更新统一适配器配置失败:': 'Failed to update unified adapter configuration:',
  '统一适配器配置更新成功，提供商数量: ${providersCount}，活跃提供商: ${activeProvidersText}':
    'Unified adapter configuration updated successfully, providers count: ${providersCount}, active providers: ${activeProvidersText}',

  // 聊天日志相关 - 变量插值格式
  '聊天日志配置已重新加载，启用状态: ${enabledStatus}，日志目录: ${logDir}':
    'Chat log configuration reloaded, enabled status: ${enabledStatus}, log directory: ${logDir}',
  '聊天日志已初始化，启用状态: ${enabledStatus}，配置: ${config}':
    'Chat log initialized, enabled status: ${enabledStatus}, config: ${config}',

  // 工具修复相关 - 变量插值格式
  '工具修复服务已初始化（简化版本，只包含 Anthropic/Claude 修复），日志级别: ${logLevel}，启用状态: ${enabled}':
    'Tool repair service initialized (simplified version, Anthropic/Claude repair only), log level: ${logLevel}, enabled status: ${enabled}',
  '模型 ${modelName} 不支持工具调用，将移除所有工具':
    'Model ${modelName} does not support tool calls, will remove all tools',

  // 请求处理相关 - 变量插值格式
  '通过统一适配器处理 OpenAI 聊天请求，模型: ${model}，流式: ${isStream}':
    'Processing OpenAI chat request through unified adapter, model: ${model}, streaming: ${isStream}',
  '模型名称格式验证失败: ${model}': 'Model name format validation failed: ${model}',
  '模型名称格式验证失败，模型: ${model}，提供商: ${provider}，模型名称: ${modelName}':
    'Model name format validation failed, model: ${model}, provider: ${provider}, model name: ${modelName}',
  'OpenAI 聊天请求处理失败:': 'OpenAI chat request processing failed:',

  // 服务器启动相关 - 变量插值格式
  '🚀 Ollama 兼容服务器启动成功，监听端口 ${port}':
    '🚀 Ollama compatible server started successfully, listening on port ${port}',
  '🔍 健康检查: ${url}': '🔍 Health check: ${url}',
  '🤖 已加载 ${modelCount} 个模型:': '🤖 Loaded ${modelCount} models:',

  // OpenAI Controller 相关
  'OpenAI 流式聊天错误:': 'OpenAI streaming chat error:',
  'OpenAI 聊天完成错误:': 'OpenAI chat completion error:',

  // Ollama Controller 相关
  获取模型列表请求: 'Get model list request',
  '缺少必需参数: model': 'Missing required parameter: model',

  // Ollama 模型信息相关 - 变量插值格式
  获取Ollama格式模型列表: 'Getting Ollama format model list',
  '获取Ollama格式模型列表失败: ${error}': 'Failed to get Ollama format model list: ${error}',
  '获取模型列表失败: ${error}': 'Failed to get model list: ${error}',
  '显示Ollama格式模型信息: ${model}': 'Displaying Ollama format model information: ${model}',
  '显示Ollama格式模型信息失败，模型: ${model}，错误: ${error}':
    'Failed to display Ollama format model information, model: ${model}, error: ${error}',
  '显示模型信息失败: ${error}': 'Failed to display model information: ${error}',
};

/**
 * 获取日志消息的英文翻译
 * @param chineseMessage 中文日志消息
 * @returns 英文翻译，如果找不到则返回空字符串
 */
export function getLogTranslation(chineseMessage: string): string {
  // 1. 直接匹配完整消息
  if (logTranslations[chineseMessage]) {
    return logTranslations[chineseMessage];
  }

  // 2. 变量插值模式匹配
  const patternTranslation = getPatternTranslation(chineseMessage);
  if (patternTranslation) {
    return patternTranslation;
  }

  return ''; // 没有找到匹配的翻译
}

/**
 * 变量插值模式匹配翻译
 * @param message 实际的日志消息
 * @returns 匹配的英文翻译，如果找不到则返回空字符串
 */
function getPatternTranslation(message: string): string {
  // 获取所有包含变量插值的翻译键
  const interpolationKeys = Object.keys(logTranslations).filter(key => key.includes('${'));

  for (const chineseTemplate of interpolationKeys) {
    const englishTemplate = logTranslations[chineseTemplate];

    // 将中文模板转换为正则表达式模式
    const pattern = createPatternFromTemplate(chineseTemplate);

    if (pattern.test(message)) {
      // 提取实际的变量值
      const matches = message.match(pattern);
      if (matches) {
        // 将英文模板中的变量替换为实际值
        return replaceVariablesInTemplate(englishTemplate, chineseTemplate, message);
      }
    }
  }

  return '';
}

/**
 * 从模板字符串创建正则表达式模式
 * @param template 包含${variable}的模板字符串
 * @returns 正则表达式
 */
function createPatternFromTemplate(template: string): RegExp {
  // 简单且有效的方法：逐个处理特殊字符
  let pattern = template;

  // 首先保护${variable}模式
  const placeholders: string[] = [];
  const placeholderMap: Record<string, string> = {};

  // 提取所有${variable}模式并用占位符替换
  pattern = pattern.replace(/\$\{[^}]+\}/g, match => {
    const placeholder = `__PLACEHOLDER_${placeholders.length}__`;
    placeholders.push(match);
    // 对于不同类型的变量使用不同的匹配模式
    const variableName = match.slice(2, -1); // 去掉${}
    if (variableName.toLowerCase().includes('message') || variableName.toLowerCase().includes('error')) {
      // 错误消息可以包含更多字符，包括空格和标点
      placeholderMap[placeholder] = '(.+?)';
    } else if (variableName.toLowerCase().includes('path') || variableName.toLowerCase().includes('url')) {
      // 路径和URL可以包含特殊字符
      placeholderMap[placeholder] = '([^,，]+?)';
    } else if (variableName.toLowerCase().includes('timestamp') || variableName.toLowerCase().includes('time')) {
      // 时间戳可以包含冒号、连字符等
      placeholderMap[placeholder] = '([^,，]+?)';
    } else if (variableName.toLowerCase().includes('providers') || variableName.toLowerCase().includes('list')) {
      // 提供商列表可以包含逗号和空格
      placeholderMap[placeholder] = '(.+?)';
    } else if (variableName.toLowerCase().includes('config') || variableName.toLowerCase().includes('json')) {
      // 配置内容可以包含特殊字符
      placeholderMap[placeholder] = '(.+?)';
    } else if (
      variableName.toLowerCase().includes('text') ||
      variableName.toLowerCase().includes('warning') ||
      variableName.toLowerCase().includes('rule')
    ) {
      // 文本内容、警告信息、规则名称可以包含空格和特殊字符
      placeholderMap[placeholder] = '(.+?)';
    } else if (variableName.toLowerCase().includes('model')) {
      // 模型名可以包含冒号和连字符，如 provider:model-name
      placeholderMap[placeholder] = '([^,，\\s]+?)';
    } else if (variableName.toLowerCase().includes('stream')) {
      // 流式参数通常是布尔值
      placeholderMap[placeholder] = '(true|false)';
    } else {
      // 普通变量不包含分隔符
      placeholderMap[placeholder] = '([^,，:：\\s]+?)';
    }
    return placeholder;
  });

  // 转义其他正则表达式特殊字符
  pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 恢复占位符为捕获组
  placeholders.forEach((_, index) => {
    const placeholder = `__PLACEHOLDER_${index}__`;
    pattern = pattern.replace(placeholder, placeholderMap[placeholder]);
  });

  // 添加开始和结束锚点
  pattern = `^${pattern}$`;

  try {
    return new RegExp(pattern);
  } catch (error) {
    console.warn(`创建正则表达式失败: ${template} -> ${pattern}`, error);
    return new RegExp('$^'); // 永远不匹配的模式
  }
}

/**
 * 将英文模板中的变量替换为实际值
 * @param englishTemplate 英文模板
 * @param chineseTemplate 中文模板
 * @param actualMessage 实际消息
 * @returns 替换后的英文消息
 */
function replaceVariablesInTemplate(englishTemplate: string, chineseTemplate: string, actualMessage: string): string {
  // 提取中文模板中的变量名（按顺序）
  const chineseVariables = chineseTemplate.match(/\$\{([^}]+)\}/g) || [];
  const englishVariables = englishTemplate.match(/\$\{([^}]+)\}/g) || [];

  if (chineseVariables.length !== englishVariables.length) {
    return englishTemplate; // 变量数量不匹配，返回原模板
  }

  // 创建正则表达式来提取实际值
  const pattern = createPatternFromTemplate(chineseTemplate);
  const matches = actualMessage.match(pattern);

  if (!matches || matches.length !== chineseVariables.length + 1) {
    return englishTemplate; // 匹配失败，返回原模板
  }

  // 创建变量名到值的映射
  const variableMap: Record<string, string> = {};
  for (let i = 0; i < chineseVariables.length; i++) {
    const chineseVarName = chineseVariables[i].slice(2, -1); // 去掉${}
    const actualValue = matches[i + 1]; // matches[0]是完整匹配，从matches[1]开始是捕获组
    variableMap[chineseVarName] = actualValue;
  }

  // 替换英文模板中的变量，根据变量名匹配
  let result = englishTemplate;
  for (const englishVar of englishVariables) {
    const englishVarName = englishVar.slice(2, -1); // 去掉${}

    // 查找对应的中文变量值
    if (variableMap.hasOwnProperty(englishVarName)) {
      result = result.replace(englishVar, variableMap[englishVarName]);
    }
  }

  return result;
}

/**
 * 检查消息是否应该显示英文翻译
 * @param message 日志消息
 * @returns 是否应该显示英文翻译
 */
export function shouldShowTranslation(message: string): boolean {
  // 检查消息中是否包含中文字符
  return /[\u4e00-\u9fff]/.test(message);
}

/**
 * 检查是否为可能的变量名或专有名词，避免误翻译
 * @param text 要检查的文本
 * @returns 是否可能是变量名或专有名词
 */
export function isPossibleVariableName(text: string): boolean {
  // 常见的变量名模式：
  // - 单个字母或数字
  // - 驼峰命名法 (camelCase)
  // - 下划线命名法 (snake_case)
  // - 短横线命名法 (kebab-case)
  // - 全大写常量 (CONSTANT_CASE)

  const variablePatterns = [
    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/, // 标准变量名
    /^[A-Z][A-Z0-9_]*$/, // 常量名
    /^[a-z]+(-[a-z]+)*$/, // kebab-case
    /^[a-zA-Z]+$/, // 单纯英文单词
    /^\d+$/, // 纯数字
    /^[a-zA-Z]\w*$/, // 以字母开头的标识符
  ];

  return variablePatterns.some(pattern => pattern.test(text.trim()));
}
