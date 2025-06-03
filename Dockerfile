# 多阶段构建，减少最终镜像大小
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/

# 构建项目
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 安装 dumb-init 用于信号处理
RUN apk add --no-cache dumb-init

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ollama -u 1001

# 复制依赖和构建结果
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

# 设置用户权限
USER ollama

# 暴露端口
EXPOSE 11434

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http=require('http');const req=http.request('http://localhost:11434/',r=>r.statusCode===200?process.exit(0):process.exit(1));req.on('error',()=>process.exit(1));req.end();"

# 使用 dumb-init 启动
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
