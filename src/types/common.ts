// 通用类型定义

// HTTP 请求相关
export interface ApiRequest {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  message?: string;
}

// 流式响应相关
export interface StreamChunk {
  data: string;
  done: boolean;
}

export interface StreamOptions {
  signal?: AbortSignal;
  onChunk?: (chunk: StreamChunk) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

// 配置相关
export interface AppConfig {
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'simple';
  };
  volcEngine: {
    apiKey: string;
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

// 错误相关
export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ValidationError {
  field: string;
  value: any;
  message: string;
}

// 分页相关
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 日志相关
export interface LogContext {
  requestId?: string;
  userId?: string;
  model?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

// 监控相关
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database?: 'up' | 'down';
    volcEngine?: 'up' | 'down';
    dashScope?: 'up' | 'down';
    deepSeek?: 'up' | 'down';
    tencentDS?: 'up' | 'down';
    models?: 'up' | 'down';
    memory?: 'ok' | 'high';
    disk?: 'ok' | 'full';
  };
}

// 性能监控
export interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: number;
}

// 系统监控
export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  loadAverage: number[];
  uptime: number;
}
