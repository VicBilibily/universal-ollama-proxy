const fs = require('fs');
const path = require('path');

/**
 * 加载并解析JSON文件，支持BOM处理
 */
function loadJsonFile(filePath) {
  let rawData = fs.readFileSync(filePath, 'utf8');

  // 移除BOM标记
  if (rawData.charCodeAt(0) === 0xfeff) {
    rawData = rawData.slice(1);
  }

  return JSON.parse(rawData);
}

/**
 * 加载GitHub模型数据，过滤所有chat类型的模型
 */
function loadGitHubModels() {
  const filePath = path.join(__dirname, 'GitHub.json');
  const data = loadJsonFile(filePath);

  // 过滤出type为chat的所有模型
  return data.data.filter(model => model.capabilities.type === 'chat');
}

/**
 * 加载OpenRouter模型数据
 */
function loadOpenRouterModels() {
  const filePath = path.join(__dirname, 'OpenRouter.json');
  const data = loadJsonFile(filePath);
  return data.data;
}

/**
 * 从文本中提取版本信息
 */
function extractVersionInfo(text) {
  if (!text) return [];

  const versions = [];
  const normalizedText = text.toLowerCase();

  // 常见版本模式
  const patterns = [
    // 标准版本号: 4.0, 3.5, 2.1等
    /\b(\d+)\.(\d+)(?:\.(\d+))?\b/g,
    // 简化版本: 4o, 3o, v4等
    /\b(?:v)?(\d+)([a-z]+)?\b/g,
    // 特殊版本标识: turbo, instruct, preview等
    /\b(turbo|instruct|preview|beta|alpha|latest|stable)\b/g,
    // 日期版本: 2024, 0125等
    /\b(20\d{2})(?:[-.]?(\d{2})(?:[-.]?(\d{2})))?\b/g,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(normalizedText)) !== null) {
      versions.push(match[0]);
    }
  });

  return [...new Set(versions)];
}

/**
 * 提取模型名称中的核心标识符
 * 支持各种命名模式的动态解析，增强版本识别
 */
function extractModelIdentifiers(model) {
  const identifiers = new Set();
  const versions = new Set();

  // 从family字段提取
  if (model.capabilities?.family) {
    const family = model.capabilities.family;
    identifiers.add(family.toLowerCase());

    // 提取版本信息
    extractVersionInfo(family).forEach(v => versions.add(v));

    // 分解复合标识符
    const parts = family.split(/[-._]/);
    parts.forEach(part => {
      if (part.length > 1) {
        identifiers.add(part.toLowerCase());
      }
    });
  }

  // 从ID字段提取
  if (model.id) {
    identifiers.add(model.id.toLowerCase());

    // 提取版本信息
    extractVersionInfo(model.id).forEach(v => versions.add(v));

    const parts = model.id.split(/[-._]/);
    parts.forEach(part => {
      if (part.length > 1) {
        identifiers.add(part.toLowerCase());
      }
    });
  }

  // 从name字段提取
  if (model.name) {
    const name = model.name.toLowerCase();

    // 提取版本信息
    extractVersionInfo(model.name).forEach(v => versions.add(v));

    // 提取主要单词（过滤常见词汇）
    const words = name.split(/[\s\-_.,()]+/);
    const stopWords = ['the', 'and', 'or', 'with', 'for', 'to', 'of', 'in', 'on', 'at', 'by', 'model'];
    words.forEach(word => {
      if (word.length > 2 && !stopWords.includes(word)) {
        identifiers.add(word);
      }
    });
  }

  return {
    identifiers: Array.from(identifiers),
    versions: Array.from(versions),
  };
}

/**
 * 计算版本匹配得分
 */
function calculateVersionMatch(gitHubVersions, openRouterVersions) {
  if (gitHubVersions.length === 0 || openRouterVersions.length === 0) {
    return 0;
  }

  let bestMatch = 0;

  gitHubVersions.forEach(ghVersion => {
    openRouterVersions.forEach(orVersion => {
      let score = 0;

      // 精确匹配
      if (ghVersion === orVersion) {
        score = 1.0;
      }
      // 包含匹配
      else if (ghVersion.includes(orVersion) || orVersion.includes(ghVersion)) {
        score = 0.8;
      }
      // 数字版本的近似匹配
      else {
        const ghNumbers = ghVersion.match(/\d+/g);
        const orNumbers = orVersion.match(/\d+/g);

        if (ghNumbers && orNumbers) {
          const ghMajor = parseInt(ghNumbers[0]);
          const orMajor = parseInt(orNumbers[0]);

          if (ghMajor === orMajor) {
            score = 0.6;

            // 检查次版本号
            if (ghNumbers.length > 1 && orNumbers.length > 1) {
              const ghMinor = parseInt(ghNumbers[1]);
              const orMinor = parseInt(orNumbers[1]);
              if (ghMinor === orMinor) {
                score = 0.7;
              }
            }
          }
        }
      }

      bestMatch = Math.max(bestMatch, score);
    });
  });

  return bestMatch;
}

/**
 * 计算两个模型的相似度得分 - 增强版本匹配权重
 */
function calculateSimilarity(gitHubModel, openRouterModel) {
  const gitHubData = extractModelIdentifiers(gitHubModel);
  const openRouterData = extractModelIdentifiers({
    name: openRouterModel.name,
    id: openRouterModel.slug,
    capabilities: { family: '' },
  });

  // 添加OpenRouter slug的分解
  const slugParts = openRouterModel.slug.split('/');
  if (slugParts.length > 1) {
    const modelPart = slugParts[1];
    openRouterData.identifiers.push(modelPart.toLowerCase());

    // 从slug提取版本信息
    extractVersionInfo(modelPart).forEach(v => openRouterData.versions.push(v));

    // 进一步分解模型部分
    const subParts = modelPart.split(/[-._]/);
    subParts.forEach(part => {
      if (part.length > 1) {
        openRouterData.identifiers.push(part.toLowerCase());
      }
    });
  }

  // 计算标识符匹配得分
  let identifierScore = 0;
  let maxPossibleScore = gitHubData.identifiers.length;

  gitHubData.identifiers.forEach(githubId => {
    const matchFound = openRouterData.identifiers.some(orId => {
      // 精确匹配
      if (githubId === orId) return true;

      // 包含匹配
      if (githubId.length > 3 && (orId.includes(githubId) || githubId.includes(orId))) {
        return true;
      }

      // 相似度匹配（编辑距离）
      if (githubId.length > 3 && orId.length > 3) {
        const distance = levenshteinDistance(githubId, orId);
        const maxLen = Math.max(githubId.length, orId.length);
        const similarity = 1 - distance / maxLen;
        return similarity > 0.8;
      }

      return false;
    });

    if (matchFound) {
      identifierScore++;
    }
  });

  // 计算版本匹配得分
  const versionScore = calculateVersionMatch(gitHubData.versions, openRouterData.versions);

  // 综合得分：70% 标识符匹配 + 30% 版本匹配
  const identifierWeight = 0.7;
  const versionWeight = 0.3;

  const finalIdentifierScore = maxPossibleScore > 0 ? identifierScore / maxPossibleScore : 0;
  const finalScore = finalIdentifierScore * identifierWeight + versionScore * versionWeight;

  return {
    total: finalScore,
    identifier: finalIdentifierScore,
    version: versionScore,
    details: {
      githubVersions: gitHubData.versions,
      openrouterVersions: openRouterData.versions,
      githubIdentifiers: gitHubData.identifiers,
      openrouterIdentifiers: openRouterData.identifiers,
    },
  };
}

/**
 * 计算两个字符串的编辑距离
 */
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // 插入
        matrix[j - 1][i] + 1, // 删除
        matrix[j - 1][i - 1] + indicator // 替换
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * 动态查找最佳匹配的OpenRouter模型 - 优先精确ID匹配
 */
function findBestOpenRouterMatch(gitHubModel, openRouterModels) {
  const gitHubFamily = gitHubModel.capabilities?.family || '';
  const gitHubId = gitHubModel.id || '';
  const gitHubName = gitHubModel.name || '';

  console.log(`\n🔍 正在匹配GitHub模型: ${gitHubName}`);
  console.log(`   ID: ${gitHubId}`);
  console.log(`   Family: ${gitHubFamily}`);

  // 第零阶段：优先检查精确ID匹配
  if (gitHubId) {
    // 特殊处理：thinking模型优先查找thinking变体
    if (gitHubId.includes('thought') || gitHubName.toLowerCase().includes('thinking')) {
      // 查找专门的thinking变体 (如: claude-3.7-sonnet-thought -> anthropic/claude-3.7-sonnet:thinking)
      const baseId = gitHubId.replace(/-thought$/, '').replace(/-thinking$/, '');
      const thinkingVariant = openRouterModels.find(
        model =>
          model.endpoint?.model_variant_slug === `anthropic/${baseId}:thinking` ||
          model.endpoint?.model_variant_slug === `openai/${baseId}:thinking` ||
          model.endpoint?.model_variant_slug === `google/${baseId}:thinking`
      );

      if (thinkingVariant) {
        console.log(`   ✅ 找到thinking变体匹配: ${thinkingVariant.name}`);
        console.log(`      OpenRouter ID: ${thinkingVariant.endpoint.model_variant_slug}`);
        console.log(`      匹配类型: Thinking变体精确匹配`);
        // 创建一个虚拟模型对象，使用thinking变体的slug
        return {
          ...thinkingVariant,
          slug: thinkingVariant.endpoint.model_variant_slug,
        };
      }
    }

    // 1. 检查完全精确匹配 (如: gpt-4 -> openai/gpt-4)
    const exactMatch = openRouterModels.find(
      model => model.slug === `openai/${gitHubId}` || model.slug === gitHubId || model.slug.endsWith(`/${gitHubId}`)
    );

    if (exactMatch) {
      console.log(`   ✅ 找到精确ID匹配: ${exactMatch.name}`);
      console.log(`      OpenRouter ID: ${exactMatch.slug}`);
      console.log(`      匹配类型: 精确ID匹配`);
      return exactMatch;
    }

    // 2. 检查部分精确匹配 (忽略版本号的差异)
    const baseId = gitHubId.replace(/-\d{4}-\d{2}-\d{2}$/, ''); // 移除日期后缀
    const partialExactMatch = openRouterModels.find(model => {
      const modelSlugPart = model.slug.split('/').pop(); // 获取最后一部分
      return modelSlugPart === baseId;
    });

    if (partialExactMatch) {
      console.log(`   ✅ 找到部分精确匹配: ${partialExactMatch.name}`);
      console.log(`      OpenRouter ID: ${partialExactMatch.slug}`);
      console.log(`      匹配类型: 部分精确匹配`);
      return partialExactMatch;
    }
  }

  console.log(`   ⚠️  未找到精确ID匹配，使用相似度算法...`);

  // 第一阶段：计算所有模型的相似度
  const candidates = openRouterModels.map(openRouterModel => {
    const similarity = calculateSimilarity(gitHubModel, openRouterModel);
    return {
      model: openRouterModel,
      similarity: similarity.total,
      identifierSimilarity: similarity.identifier,
      versionSimilarity: similarity.version,
      details: similarity.details,
    };
  });

  // 过滤相似度太低的候选者
  const filteredCandidates = candidates.filter(c => c.similarity > 0.3);

  if (filteredCandidates.length === 0) {
    console.log(`❌ 未找到相似度足够的候选模型`);
    return null;
  }

  console.log(`   找到 ${filteredCandidates.length} 个相似度 > 30% 的候选模型`);

  // 第二阶段：优化排序逻辑，优先考虑版本匹配
  const sortedCandidates = filteredCandidates.sort((a, b) => {
    // 1. 优先考虑版本匹配得分高的
    const versionDiff = b.versionSimilarity - a.versionSimilarity;
    if (Math.abs(versionDiff) > 0.2) {
      return versionDiff;
    }

    // 2. 版本匹配相近时，比较总体相似度
    const totalDiff = b.similarity - a.similarity;
    if (Math.abs(totalDiff) > 0.1) {
      return totalDiff;
    }

    // 3. 相似度接近时，优先选择更新的模型
    const dateA = new Date(a.model.updated_at);
    const dateB = new Date(b.model.updated_at);
    if (Math.abs(dateB.getTime() - dateA.getTime()) > 24 * 60 * 60 * 1000) {
      // 超过1天差异
      return dateB.getTime() - dateA.getTime();
    }

    // 4. 优先选择没有预览/测试标记的模型
    const aIsStable = !/(preview|beta|alpha|experimental|test)/i.test(a.model.name);
    const bIsStable = !/(preview|beta|alpha|experimental|test)/i.test(b.model.name);

    if (aIsStable !== bIsStable) {
      return bIsStable - aIsStable;
    }

    // 5. 最后按名称排序
    return a.model.name.localeCompare(b.model.name);
  });

  const bestMatch = sortedCandidates[0];

  console.log(`   ✅ 最佳匹配: ${bestMatch.model.name}`);
  console.log(`      总体相似度: ${(bestMatch.similarity * 100).toFixed(1)}%`);
  console.log(`      标识符匹配: ${(bestMatch.identifierSimilarity * 100).toFixed(1)}%`);
  console.log(`      版本匹配: ${(bestMatch.versionSimilarity * 100).toFixed(1)}%`);
  console.log(`      OpenRouter ID: ${bestMatch.model.slug}`);

  // 显示版本匹配详情
  if (bestMatch.details.githubVersions.length > 0 || bestMatch.details.openrouterVersions.length > 0) {
    console.log(`      GitHub版本: [${bestMatch.details.githubVersions.join(', ')}]`);
    console.log(`      OpenRouter版本: [${bestMatch.details.openrouterVersions.join(', ')}]`);
  }

  // 显示其他高相似度候选者
  const topCandidates = sortedCandidates.slice(1, 3).filter(c => c.similarity > 0.5);
  if (topCandidates.length > 0) {
    console.log(`   其他候选者:`);
    topCandidates.forEach(c => {
      console.log(
        `      ${c.model.name} (总体: ${(c.similarity * 100).toFixed(1)}%, 版本: ${(c.versionSimilarity * 100).toFixed(1)}%)`
      );
    });
  }

  return bestMatch.model;
}

/**
 * 检测是否为思考模型
 */
function isThinkingModel(openRouterModel) {
  // 检查各种思考模型的标识
  const thinkingIndicators = [
    // ID中包含thinking标识
    openRouterModel.slug?.includes(':thinking'),
    openRouterModel.slug?.includes('-thinking'),
    openRouterModel.slug?.includes('thought'),

    // 名称中包含thinking标识
    openRouterModel.name?.toLowerCase().includes('thinking'),
    openRouterModel.name?.toLowerCase().includes('thought'),

    // 支持reasoning参数
    openRouterModel.supports_reasoning === true,

    // variant字段标识
    openRouterModel.variant === 'thinking',

    // supported_parameters包含reasoning
    Array.isArray(openRouterModel.supported_parameters) && openRouterModel.supported_parameters.includes('reasoning'),

    // 具有reasoning_config
    !!openRouterModel.reasoning_config,
  ];

  return thinkingIndicators.some(indicator => indicator);
}

/**
 * 计算思考模型的reasoning_tokens限制
 */
function calculateReasoningTokens(openRouterModel) {
  // 基于模型的最大输出tokens计算合理的reasoning_tokens值
  const maxCompletionTokens = openRouterModel.max_completion_tokens || 16384;
  const contextLength = openRouterModel.context_length || 128000;

  // 对于思考模型，reasoning_tokens通常是输出tokens的一部分
  // 设置为max_completion_tokens的25%，但至少1024，最多8192
  const reasoningTokens = Math.min(Math.max(Math.floor(maxCompletionTokens * 0.25), 1024), 8192);

  return reasoningTokens;
}

/**
 * 将GitHub模型配置转换为OpenRouter格式
 * 原样保留GitHub配置，仅替换ID，并为思考模型添加必要的配置
 */
function convertGitHubToOpenRouterConfig(gitHubModel, openRouterModel) {
  // 深拷贝GitHub模型配置
  const config = JSON.parse(JSON.stringify(gitHubModel));

  // 移除policy节（如果存在）
  if (config.policy) {
    delete config.policy;
  }

  // 仅替换ID为OpenRouter模型ID
  config.id = openRouterModel.slug;

  // 检查是否为免费模型并启用 - 优先检查 :free 结尾
  const modelVariantSlug = openRouterModel.endpoint?.model_variant_slug || openRouterModel.slug;
  const isEndpointFree = openRouterModel.endpoint?.is_free === true;
  const isVariantFree = modelVariantSlug.includes(':free');
  const isNameFree = openRouterModel.name?.toLowerCase().includes('(free)');
  const isFreeModel = isEndpointFree || isVariantFree || isNameFree;

  if (isFreeModel) {
    config.model_picker_enabled = true;
    console.log(`   💰 检测到免费模型: ${openRouterModel.name || openRouterModel.slug} - 已默认启用`);
  }

  // 检测并配置思考模型
  if (isThinkingModel(openRouterModel)) {
    console.log(`   🧠 检测到思考模型: ${openRouterModel.name || openRouterModel.slug}`);

    // 确保capabilities.supports存在
    if (!config.capabilities) {
      config.capabilities = {};
    }
    if (!config.capabilities.supports) {
      config.capabilities.supports = {};
    }
    if (!config.capabilities.limits) {
      config.capabilities.limits = {};
    }

    // 添加思考支持
    config.capabilities.supports.thinking = true;

    // 添加reasoning_tokens限制
    const reasoningTokens = calculateReasoningTokens(openRouterModel);
    config.capabilities.limits.reasoning_tokens = reasoningTokens;

    console.log(`      ✅ 已添加思考配置: supports.thinking=true, reasoning_tokens=${reasoningTokens}`);

    // 记录用于调试的信息
    console.log(`      🔍 检测依据:`);
    if (openRouterModel.slug?.includes(':thinking')) {
      console.log(`         • ID包含':thinking': ${openRouterModel.slug}`);
    }
    if (openRouterModel.supports_reasoning) {
      console.log(`         • supports_reasoning: ${openRouterModel.supports_reasoning}`);
    }
    if (openRouterModel.variant === 'thinking') {
      console.log(`         • variant: ${openRouterModel.variant}`);
    }
    if (
      Array.isArray(openRouterModel.supported_parameters) &&
      openRouterModel.supported_parameters.includes('reasoning')
    ) {
      console.log(`         • supported_parameters包含'reasoning'`);
    }
  }

  return config;
}

/**
 * 去重匹配结果：当多个GitHub模型映射到同一个OpenRouter模型ID时，只保留最佳匹配
 * 最佳匹配标准：精确ID匹配 > 相似度得分 > model_picker_enabled偏好
 */
function deduplicateMatches(configs, results) {
  // 按OpenRouter模型ID分组
  const groupedByOpenRouterId = {};

  configs.forEach((config, index) => {
    const openRouterId = config.id;
    if (!groupedByOpenRouterId[openRouterId]) {
      groupedByOpenRouterId[openRouterId] = [];
    }

    groupedByOpenRouterId[openRouterId].push({
      config,
      result: results[index],
      index,
    });
  });

  // 过滤出重复项并记录详细信息
  const duplicateGroups = Object.entries(groupedByOpenRouterId).filter(([, group]) => group.length > 1);

  if (duplicateGroups.length > 0) {
    console.log(`\n   🔍 发现以下重复的OpenRouter模型ID:`);
    duplicateGroups.forEach(([openRouterId, group]) => {
      console.log(`      • ${openRouterId}:`);
      group.forEach(item => {
        const githubId = item.result.github_id ? `(${item.result.github_id})` : '(额外模型)';
        console.log(`        - ${item.result.github_name} ${githubId}`);
      });
    });
  }

  const finalConfigs = [];
  const finalResults = [];

  // 对每个组选择最佳匹配
  Object.entries(groupedByOpenRouterId).forEach(([openRouterId, group]) => {
    let bestMatch = group[0];

    if (group.length > 1) {
      // 根据匹配质量选择最佳匹配
      bestMatch = group.reduce((best, current) => {
        // 1. 优先选择精确ID匹配
        const bestIsExactMatch = isExactIdMatch(best.result.github_id, best.result.openrouter_id);
        const currentIsExactMatch = isExactIdMatch(current.result.github_id, current.result.openrouter_id);

        if (bestIsExactMatch !== currentIsExactMatch) {
          return currentIsExactMatch ? current : best;
        }

        // 2. 选择model_picker_enabled为true的模型（GitHub偏好）
        const bestPickerEnabled = best.config.capabilities?.model_picker_enabled === true;
        const currentPickerEnabled = current.config.capabilities?.model_picker_enabled === true;

        if (bestPickerEnabled !== currentPickerEnabled) {
          return currentPickerEnabled ? current : best;
        }

        // 3. 选择更简洁的GitHub ID（更通用的模型）
        // 处理null或undefined的GitHub ID
        const bestGithubId = best.result.github_id || '';
        const currentGithubId = current.result.github_id || '';

        const bestIdLength = bestGithubId.length;
        const currentIdLength = currentGithubId.length;

        if (Math.abs(bestIdLength - currentIdLength) > 5) {
          return currentIdLength < bestIdLength ? current : best;
        }

        // 4. 选择GitHub ID字典序较早的（通常是更基础的模型）
        const idComparison = bestGithubId.localeCompare(currentGithubId);
        return idComparison <= 0 ? best : current;
      });

      console.log(`   🎯 选择最佳匹配: ${bestMatch.result.github_name} -> ${openRouterId}`);
      console.log(`      保留原因: ${getSelectionReason(bestMatch, group)}`);
    }

    finalConfigs.push(bestMatch.config);
    finalResults.push(bestMatch.result);
  });

  return {
    deduplicatedConfigs: finalConfigs,
    deduplicatedResults: finalResults,
  };
}

/**
 * 检查是否为精确ID匹配
 */
function isExactIdMatch(githubId, openRouterId) {
  if (!githubId || !openRouterId) return false;

  // 检查完全匹配
  if (openRouterId === `openai/${githubId}` || openRouterId === githubId || openRouterId.endsWith(`/${githubId}`)) {
    return true;
  }

  // 检查去除日期后缀的匹配
  const baseGithubId = githubId.replace(/-\d{4}-\d{2}-\d{2}$/, '');
  const openRouterModelPart = openRouterId.split('/').pop();

  return openRouterModelPart === baseGithubId;
}

/**
 * 获取选择原因的描述
 */
function getSelectionReason(selectedMatch, allMatches) {
  const githubId = selectedMatch.result.github_id;
  const openRouterId = selectedMatch.result.openrouter_id;

  // 检查精确匹配
  if (isExactIdMatch(githubId, openRouterId)) {
    return '精确ID匹配';
  }

  // 检查model_picker_enabled
  if (selectedMatch.config.capabilities?.model_picker_enabled === true) {
    const hasOtherPickerEnabled = allMatches.some(
      m => m !== selectedMatch && m.config.capabilities?.model_picker_enabled === true
    );
    if (!hasOtherPickerEnabled) {
      return 'GitHub偏好设置(model_picker_enabled=true)';
    }
  }

  // 检查ID长度
  // 安全处理可能为null或undefined的githubId
  if (!githubId) {
    return '额外模型';
  }

  const selectedIdLength = githubId.length;
  const hasLongerIds = allMatches.some(m => {
    const otherId = m.result.github_id || '';
    return otherId.length > selectedIdLength + 5;
  });
  if (hasLongerIds) {
    return '更简洁的GitHub ID';
  }

  return '字典序优先';
}

/**
 * 获取额外的模型系列
 * 添加Grok、Qwen、Qwen3、DeepSeek、Moonshot、Tencent、Baidu系列模型
 * 包含所有变体（无论后缀是什么，如:free、:thinking等）
 */
function getAdditionalModelSeries(openRouterModels) {
  const additionalModels = [];

  // 定义要包含的模型系列及其标识符
  const targetSeries = [
    {
      name: 'Grok',
      authors: ['x-ai'],
      groups: ['Grok'],
      slugPatterns: [/^x-ai\/grok/i],
      namePatterns: [/grok/i],
    },
    {
      name: 'Qwen',
      authors: ['qwen'],
      groups: ['Qwen', 'Qwen3'],
      slugPatterns: [/^qwen\//i, /qwen/i],
      namePatterns: [/qwen/i],
    },
    {
      name: 'DeepSeek',
      authors: ['deepseek'],
      groups: ['DeepSeek'], // 注意：DeepSeek模型的group可能是其他值如Qwen、Llama3等
      slugPatterns: [/^deepseek\//i, /deepseek/i],
      namePatterns: [/deepseek/i],
    },
    {
      name: 'Moonshot',
      authors: ['moonshot'],
      groups: ['Moonshot'],
      slugPatterns: [/^moonshot\//i, /moonshot/i],
      namePatterns: [/moonshot/i, /kimi/i],
    },
    {
      name: 'Tencent',
      authors: ['tencent'],
      groups: ['Tencent'],
      slugPatterns: [/^tencent\//i, /tencent/i, /hunyuan/i],
      namePatterns: [/tencent/i, /hunyuan/i],
    },
    {
      name: 'Baidu',
      authors: ['baidu'],
      groups: ['Baidu'],
      slugPatterns: [/^baidu\//i, /baidu/i, /ernie/i],
      namePatterns: [/baidu/i, /ernie/i, /文心/i],
    },
    {
      name: 'Mistral',
      authors: ['mistralai'],
      groups: ['Mistral'],
      slugPatterns: [/^mistralai\//i, /mistral/i],
      namePatterns: [/mistral/i, /magistral/i, /devstral/i],
    },
    {
      name: 'Google',
      authors: ['google'],
      groups: ['Gemini', 'Other'],
      slugPatterns: [/^google\//i, /gemini/i, /gemma/i],
      namePatterns: [/google/i, /gemini/i, /gemma/i, /bard/i],
    },
    {
      name: 'THUDM',
      authors: ['thudm'],
      groups: ['THUDM'],
      slugPatterns: [/^thudm\//i, /thudm/i, /zhipuai/i, /glm/i],
      namePatterns: [/thudm/i, /zhipuai/i, /glm/i, /智谱/i, /chatglm/i],
    },
  ];

  console.log('\n🔍 正在搜索额外的模型系列（包含所有变体）...');

  targetSeries.forEach(series => {
    console.log(`\n   正在搜索 ${series.name} 模型...`);

    const seriesModels = openRouterModels.filter(model => {
      // 跳过隐藏的模型
      if (model.hidden) {
        return false;
      }

      // 检查作者
      const authorMatch = series.authors.some(
        author => model.author === author || model.slug?.startsWith(`${author}/`)
      );

      // 检查组别
      const groupMatch = series.groups.includes(model.group);

      // 检查slug模式
      const slugMatch = series.slugPatterns.some(pattern => pattern.test(model.slug || ''));

      // 检查名称匹配（作为备用匹配）
      const nameMatch =
        series.name.toLowerCase() === 'qwen'
          ? model.name?.toLowerCase().includes('qwen')
          : model.name?.toLowerCase().includes(series.name.toLowerCase());

      // 必须有有效的端点
      const hasValidEndpoint = model.endpoint && (model.endpoint.id || model.endpoint.model);

      const isMatch = (authorMatch || groupMatch || slugMatch || nameMatch) && hasValidEndpoint;

      // 不再为每个匹配输出日志
      return isMatch;
    });

    console.log(`     找到 ${seriesModels.length} 个 ${series.name} 模型`);

    // 按模型基础名称分组，显示所有变体
    const modelGroups = {};
    seriesModels.forEach(model => {
      // 提取基础模型名称（移除后缀如:free、:thinking等）
      const modelVariantSlug = model.endpoint?.model_variant_slug || model.slug;
      const baseSlug = modelVariantSlug.split(':')[0];
      if (!modelGroups[baseSlug]) {
        modelGroups[baseSlug] = [];
      }
      modelGroups[baseSlug].push(model);
    });

    // 不再输出详细的分组信息和变体

    // 添加所有模型（包括所有变体）
    seriesModels.forEach(model => {
      additionalModels.push({
        openRouterModel: model,
        series: series.name,
      });
    });

    // 额外检查：确保没有遗漏任何变体
    const allVariants = Object.values(modelGroups).flat();
    const uniqueBaseSlugs = Object.keys(modelGroups);
    // 计算变体统计但不输出详细日志
    const freeVariants = allVariants.filter(m => {
      const modelVariantSlug = m.endpoint?.model_variant_slug || m.slug;
      const isEndpointFree = m.endpoint?.is_free === true;
      const isVariantFree = modelVariantSlug.includes(':free');
      const isNameFree = m.name.toLowerCase().includes('(free)');
      return isEndpointFree || isVariantFree || isNameFree;
    });
    const thinkingVariants = allVariants.filter(m => {
      const modelVariantSlug = m.endpoint?.model_variant_slug || m.slug;
      return modelVariantSlug.includes(':thinking') || modelVariantSlug.includes('thought');
    });
  });

  // 按系列统计
  const seriesStats = {};
  additionalModels.forEach(({ series }) => {
    seriesStats[series] = (seriesStats[series] || 0) + 1;
  });
  console.log(`\n✅ 发现 ${additionalModels.length} 个额外模型（分布在${Object.keys(seriesStats).length}个系列）`);

  return additionalModels;
}

/**
 * 为额外模型创建配置
 * 基于OpenRouter模型信息生成标准化的GitHub模型配置
 */
function createConfigForAdditionalModel(openRouterModel, seriesName) {
  const slug = openRouterModel.slug;
  const name = openRouterModel.name;
  const shortName = openRouterModel.short_name || name;

  // 获取正确的模型ID - 使用model_variant_slug或原始slug
  const modelVariantSlug = openRouterModel.endpoint?.model_variant_slug || slug;
  const modelId = modelVariantSlug;

  // 提取family信息
  const family = openRouterModel.group || seriesName;

  // 提取供应商信息
  let vendor = 'openrouter';
  if (modelId.includes('/')) {
    vendor = modelId.split('/')[0];
  }

  // 从模型名称和ID中推断版本
  const versionInfo = extractVersionInfo(name + ' ' + modelId);
  const version = versionInfo.length > 0 ? versionInfo[0] : '1.0';

  // 检查是否为免费模型 - 优先检查endpoint的is_free字段，然后检查变体slug和名称
  const isEndpointFree = openRouterModel.endpoint?.is_free === true;
  const isVariantFree = modelVariantSlug.includes(':free');
  const isNameFree = name.toLowerCase().includes('(free)');
  const isFreeModel = isEndpointFree || isVariantFree || isNameFree;

  // 检查模型是否为预览版
  const isPreview =
    name.toLowerCase().includes('preview') ||
    name.toLowerCase().includes('beta') ||
    modelId.includes('preview') ||
    modelId.includes('beta');

  // 基础配置模板 - 完全匹配ModelConfig接口定义
  const config = {
    id: modelId, // 使用正确的变体ID
    name: name,
    object: 'model',
    vendor: vendor,
    version: version,
    preview: isPreview,
    model_picker_enabled: isFreeModel,
    capabilities: {
      family: family,
      object: 'model_capabilities',
      tokenizer: 'o200k_base',
      type: 'chat',
      supports: {
        streaming: true,
        tool_calls: false,
        parallel_tool_calls: false,
        structured_outputs: false,
        vision: false,
      },
      limits: {
        max_context_window_tokens: openRouterModel.context_length || 128000,
        max_output_tokens: openRouterModel.endpoint?.max_completion_tokens || 4096,
        max_prompt_tokens: openRouterModel.endpoint?.max_prompt_tokens || 32000,
      },
    },
  };

  // 根据OpenRouter endpoint配置更新capabilities
  if (openRouterModel.endpoint) {
    const endpoint = openRouterModel.endpoint;

    // 检查支持的参数来确定功能
    if (Array.isArray(endpoint.supported_parameters)) {
      const params = endpoint.supported_parameters;

      config.capabilities.supports.tool_calls = params.includes('tools') || params.includes('tool_choice');
      config.capabilities.supports.parallel_tool_calls = config.capabilities.supports.tool_calls;
      config.capabilities.supports.structured_outputs = params.includes('response_format');

      // 检查视觉支持
      config.capabilities.supports.vision =
        openRouterModel.input_modalities?.includes('image') ||
        openRouterModel.input_modalities?.includes('file') ||
        params.includes('images');
    }

    // 更新token限制，使用正确的字段名称
    if (endpoint.max_completion_tokens) {
      config.capabilities.limits.max_output_tokens = endpoint.max_completion_tokens;
    }
    if (endpoint.max_prompt_tokens) {
      config.capabilities.limits.max_prompt_tokens = endpoint.max_prompt_tokens;
    }
  }

  // 检测并配置思考模型
  if (isThinkingModel(openRouterModel)) {
    config.capabilities.supports.thinking = true;
    const reasoningTokens = calculateReasoningTokens(openRouterModel);
    config.capabilities.limits.reasoning_tokens = reasoningTokens;
  }

  return config;
}

/**
 * 主函数
 */
function main() {
  try {
    console.log('🚀 开始生成OpenRouter模型配置...\n');

    // 加载数据
    const gitHubModels = loadGitHubModels();
    const openRouterModels = loadOpenRouterModels();

    console.log(`📊 数据统计:`);
    console.log(`   GitHub模型 (chat + model_picker): ${gitHubModels.length} 个`);
    console.log(`   OpenRouter模型: ${openRouterModels.length} 个`);

    // 显示GitHub模型信息
    console.log('\n📋 待转换的GitHub模型:');
    gitHubModels.forEach((model, index) => {
      console.log(`   ${index + 1}. ${model.name} (${model.id})`);
      console.log(`      Family: ${model.capabilities?.family || 'N/A'}`);
    });

    console.log('\n🔄 开始动态匹配和转换...');

    // 转换GitHub模型配置
    const convertedConfigs = [];
    const matchResults = [];

    for (const gitHubModel of gitHubModels) {
      const matchedOpenRouterModel = findBestOpenRouterMatch(gitHubModel, openRouterModels);

      if (matchedOpenRouterModel) {
        const config = convertGitHubToOpenRouterConfig(gitHubModel, matchedOpenRouterModel);
        convertedConfigs.push(config);

        // 使用model_variant_slug作为openrouter_id（如果存在）
        const openrouterId = matchedOpenRouterModel.endpoint?.model_variant_slug || matchedOpenRouterModel.slug;

        matchResults.push({
          github_name: gitHubModel.name,
          github_id: gitHubModel.id,
          github_family: gitHubModel.capabilities?.family,
          openrouter_name: matchedOpenRouterModel.name,
          openrouter_id: openrouterId,
          source: 'GitHub',
        });
      } else {
        console.log(`❌ 跳过未匹配的模型: ${gitHubModel.name}`);
      }
    }

    console.log(`\n✅ GitHub模型转换完成: ${convertedConfigs.length}/${gitHubModels.length} 个模型成功转换`);

    // 添加额外的模型系列
    console.log('\n🔄 开始添加额外的模型系列...');
    const additionalModels = getAdditionalModelSeries(openRouterModels);

    additionalModels.forEach(({ openRouterModel, series }) => {
      const config = createConfigForAdditionalModel(openRouterModel, series);
      convertedConfigs.push(config);

      // 使用model_variant_slug作为openrouter_id（如果存在）
      const openrouterId = openRouterModel.endpoint?.model_variant_slug || openRouterModel.slug;

      matchResults.push({
        github_name: openRouterModel.name,
        github_id: null, // 额外模型不输出GitHub ID
        github_family: series,
        openrouter_name: openRouterModel.name,
        openrouter_id: openrouterId,
        source: 'Additional',
      });
    });

    console.log(`\n✅ 额外模型添加完成: 新增 ${additionalModels.length} 个模型`);
    console.log(`📊 当前总计: ${convertedConfigs.length} 个模型配置`);

    // 去重逻辑：按OpenRouter模型ID分组，只保留最佳匹配
    console.log('\n🔄 正在处理重复项，保留最佳匹配...');
    const { deduplicatedConfigs, deduplicatedResults } = deduplicateMatches(convertedConfigs, matchResults);

    const removedCount = convertedConfigs.length - deduplicatedConfigs.length;
    if (removedCount > 0) {
      console.log(`   📋 发现 ${removedCount} 个重复的OpenRouter模型ID，已去重`);
    } else {
      console.log(`   ✅ 未发现重复项`);
    }

    // 更新为去重后的结果
    const finalConfigs = deduplicatedConfigs;
    const finalResults = deduplicatedResults;

    // 保存配置文件
    const outputPath = path.join(__dirname, '../../config/openrouter-models.json');

    // 确保输出目录存在
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // 创建符合项目标准的配置格式
    const finalConfig = {
      models: finalConfigs,
      object: 'list',
      meta: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0], // YYYY-MM-DD 格式
        source: 'https://openrouter.ai/api/v1',
        description:
          'OpenRouter 模型配置文件 - 基于 GitHub Copilot 官方支持模型动态生成，并包含额外的Grok、Qwen、DeepSeek、Moonshot、Tencent、Baidu、Mistral、Google、THUDM系列模型',
        originalSource: 'scripts/models/GitHub.json',
        mappingCount: finalConfigs.length,
        supportedFeatures: {
          categories: ['chat'],
          capabilities: ['tool_calls', 'streaming', 'structured_outputs', 'vision', 'parallel_tool_calls', 'thinking'],
        },
        additionalSeries: [
          'Grok',
          'Qwen',
          'Qwen3',
          'DeepSeek',
          'Moonshot',
          'Tencent',
          'Baidu',
          'Mistral',
          'Google',
          'THUDM',
        ],
      },
    };

    // 写入配置文件
    fs.writeFileSync(outputPath, JSON.stringify(finalConfig, null, 2), 'utf8');

    console.log(`\n📁 配置已保存到: ${outputPath}`);
    console.log(`📈 总共生成了 ${finalConfigs.length} 个模型配置`);

    // 按来源统计
    const sourceStats = {
      GitHub: finalResults.filter(r => r.source === 'GitHub').length,
      Additional: finalResults.filter(r => r.source === 'Additional').length,
    };

    console.log('\n📊 来源统计:');
    console.log(`   GitHub 官方模型: ${sourceStats.GitHub} 个`);
    console.log(`   额外系列模型: ${sourceStats.Additional} 个`);

    // 统计family分布
    const familyStats = {};
    finalConfigs.forEach(config => {
      const family = config.capabilities?.family || 'Unknown';
      familyStats[family] = (familyStats[family] || 0) + 1;
    });

    console.log('📈 模型系列分布:');
    Object.entries(familyStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([family, count]) => {
        console.log(`   ${family}: ${count} 个模型`);
      });

    // 输出匹配结果表格 - 分开显示GitHub模型和额外模型
    console.log('\n📋 匹配结果表格:');

    // GitHub模型表格
    const githubResults = finalResults.filter(r => r.source === 'GitHub');
    console.log('\n🔄 GitHub匹配的模型:');
    console.log(
      '┌────┬──────────────────────────────────────────┬─────────────────────────────────┬───────────────────────────────────────────────────────────────────┐'
    );
    console.log(
      '│  # │ 模型名称                                 │ GitHub ID                       │ OpenRouter ID                                                     │'
    );
    console.log(
      '├────┼──────────────────────────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────┤'
    );

    githubResults.forEach((result, index) => {
      const num = String(index + 1).padStart(2, ' ');
      const githubName = result.github_name.padEnd(40, ' ').substring(0, 40);
      const githubId = result.github_id.padEnd(31, ' ').substring(0, 31);
      const openrouterId = result.openrouter_id.padEnd(65, ' ').substring(0, 65);

      console.log(`│ ${num} │ ${githubName} │ ${githubId} │ ${openrouterId} │`);
    });

    console.log(
      '└────┴──────────────────────────────────────────┴─────────────────────────────────┴───────────────────────────────────────────────────────────────────┘'
    );

    // 额外模型表格
    const additionalResults = finalResults.filter(r => r.source === 'Additional');
    console.log('\n➕ 额外添加的模型:');
    console.log(
      '┌────┬─────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────┐'
    );
    console.log(
      '│  # │ 模型名称                                                │ OpenRouter ID                                                     │'
    );
    console.log(
      '├────┼─────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────┤'
    );

    additionalResults.forEach((result, index) => {
      const num = String(index + 1).padStart(2, ' ');
      const modelName = result.github_name.padEnd(55, ' ').substring(0, 55);
      const openrouterId = result.openrouter_id.padEnd(65, ' ').substring(0, 65);

      console.log(`│ ${num} │ ${modelName} │ ${openrouterId} │`);
    });

    console.log(
      '└────┴─────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────┘'
    );

    // 统计信息摘要
    console.log('\n📊 匹配统计摘要:');
    console.log(`   • 总共处理: ${gitHubModels.length} 个GitHub官方模型 + ${additionalModels.length} 个额外模型`);
    console.log(`   • 成功配置: ${finalConfigs.length} 个模型`);
    console.log(`   • GitHub模型成功率: ${((sourceStats.GitHub / gitHubModels.length) * 100).toFixed(1)}%`);
    console.log(`   • 额外模型: ${sourceStats.Additional} 个`);

    // 只计算GitHub模型的精确匹配数量，跳过额外模型
    const exactMatches = finalResults.filter(
      r =>
        r.source === 'GitHub' &&
        r.github_id &&
        r.openrouter_id &&
        r.openrouter_id.includes(r.github_id.replace(/^gpt-/, '').replace(/-\d{4}-\d{2}-\d{2}$/, ''))
    );
    // 只统计GitHub模型的匹配情况
    const githubMatches = finalResults.filter(r => r.source === 'GitHub');
    console.log(`   • 精确ID匹配: ${exactMatches.length} 个`);
    console.log(`   • 相似度匹配: ${githubMatches.length - exactMatches.length} 个`);

    // 思考模型统计
    const thinkingModels = finalConfigs.filter(config => config.capabilities?.supports?.thinking === true);
    console.log(`   • 思考模型: ${thinkingModels.length} 个`);

    console.log('\n🎉 配置生成完成！');
    console.log('🔧 新增功能:');
    console.log('   • 支持Grok、Qwen、Qwen3、DeepSeek、Moonshot、Tencent、Baidu、Mistral、Google、THUDM系列模型');
    console.log('   • 自动检测和配置思考模型');
    console.log('   • 完整的功能特性检测和配置');
  } catch (error) {
    console.error('❌ 生成配置时出错:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  loadGitHubModels,
  loadOpenRouterModels,
  extractVersionInfo,
  extractModelIdentifiers,
  calculateVersionMatch,
  calculateSimilarity,
  findBestOpenRouterMatch,
  isThinkingModel,
  calculateReasoningTokens,
  convertGitHubToOpenRouterConfig,
  deduplicateMatches,
  isExactIdMatch,
  getSelectionReason,
  getAdditionalModelSeries,
  createConfigForAdditionalModel,
  main,
};
