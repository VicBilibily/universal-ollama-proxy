import dotenv from 'dotenv';

// 加载 .env 文件，但不覆盖系统环境变量
// 这样系统环境变量的优先级高于 .env 文件
dotenv.config({ override: false });

export interface AppConfig {
  port: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '11434', 10),
};

export const validateConfig = (): void => {
  // 基本配置验证
  if (isNaN(config.port) || config.port <= 0 || config.port > 65535) {
    throw new Error('端口号必须是1-65535之间的有效数字');
  }
};
