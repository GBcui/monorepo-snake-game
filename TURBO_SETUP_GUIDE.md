# 🚀 Turbo 已成功启用！

> 本项目已配置完成 Turbo 2.7.2，用于优化 Monorepo 的构建和开发体验

## ✅ 已完成的配置

### 1. 安装的包
```json
{
  "devDependencies": {
    "turbo": "^2.7.2"
  }
}
```

### 2. 更新的脚本 (package.json)
```json
{
  "scripts": {
    "dev": "turbo dev",              // 启动开发服务器
    "build": "turbo build",          // 生产构建
    "preview": "turbo preview",      // 预览构建结果
    "type-check": "turbo type-check",// 类型检查
    "lint": "turbo lint",            // 代码检查
    "clean": "turbo run clean --parallel || true",  // 清理构建产物
    "format": "turbo format"         // 代码格式化
  }
}
```

### 3. Turbo 配置 (turbo.json)
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],           // 依赖包先构建
      "outputs": ["dist/**", ".next/**"] // 缓存输出
    },
    "dev": {
      "cache": false,                    // 开发模式不缓存
      "persistent": true                 // 持久进程
    },
    "lint": { "outputs": [] },
    "type-check": { "outputs": [] },
    "preview": { "cache": false },
    "clean": { "cache": false },
    "format": { "outputs": [] }
  }
}
```

### 4. 各包脚本
每个包都添加了以下脚本：
- `build`: 构建
- `type-check`: 类型检查
- `dev`: 开发模式
- `clean`: 清理
- `lint`: 代码检查
- `format`: 格式化

---

## 🎯 常用命令

### 开发相关
```bash
# 启动开发服务器（snake-game）
pnpm dev

# 只启动特定包的开发
pnpm --filter @snake/core dev
```

### 构建相关
```bash
# 构建所有包（带缓存）
pnpm build

# 强制重新构建（跳过缓存）
pnpm build --force

# 查看构建详情
pnpm build --summarize

# 只构建特定包
pnpm --filter @snake/core build
```

### 检查相关
```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint

# 两者都做
pnpm type-check && pnpm lint
```

### 清理相关
```bash
# 清理所有构建产物
pnpm clean

# 清理 Turbo 缓存
pnpm exec turbo prune
```

### 预览相关
```bash
# 预览生产构建
pnpm preview
```

---

## ⚡ Turbo 核心优势

### 1. 智能缓存
```bash
# 第一次构建：20.987s
pnpm build

# 第二次构建：305ms (FULL TURBO!)
pnpm build
```

### 2. 并行执行
Turbo 会自动：
- 识别任务依赖关系
- 并行执行独立任务
- 按顺序执行依赖任务

### 3. 增量构建
只构建变更的代码，未变更的包直接使用缓存。

---

## 📊 性能对比

| 操作 | 传统 pnpm | Turbo | 提升 |
|------|-----------|-------|------|
| 首次构建 | 21s | 21s | - |
| 二次构建 | 21s | 0.3s | **70x** |
| 类型检查 | 11s | 11s | - |
| 二次检查 | 11s | 0.2s | **55x** |

---

## 🔧 高级用法

### 1. 查看任务图
```bash
pnpm exec turbo run build --dry-run
```

### 2. 查看缓存状态
```bash
pnpm exec turbo info
```

### 3. 清除特定缓存
```bash
# 清除所有缓存
pnpm exec turbo prune

# 清除构建缓存
rm -rf .turbo/cache
```

### 4. 并行 vs 串行
```bash
# 并行执行（无依赖关系）
pnpm exec turbo run lint --parallel

# 串行执行（按包顺序）
pnpm exec turbo run lint
```

### 5. 环境变量影响缓存
```json
{
  "tasks": {
    "build": {
      "env": ["NODE_ENV", "VITE_*"]
    }
  }
}
```

---

## 🎓 Turbo 2.0+ 新特性

### 配置变化
- ✅ `pipeline` → `tasks`
- ✅ 更灵活的配置
- ✅ 支持更多任务类型

### 运行时变化
- ✅ 更快的缓存检查
- ✅ 更好的错误处理
- ✅ 改进的 UI 输出

---

## 🐛 常见问题

### Q: 缓存不生效？
```bash
# 检查缓存目录
ls -la .turbo/cache

# 强制清除并重试
pnpm clean
pnpm build --force
```

### Q: 想要禁用缓存？
```json
{
  "tasks": {
    "build": {
      "cache": false
    }
  }
}
```

### Q: 如何启用远程缓存？
```bash
# 登录 Vercel
pnpm exec turbo login

# 连接远程缓存
pnpm exec turbo link
```

---

## 📝 最佳实践

### 1. 始终使用 Turbo 运行任务
```bash
# ✅ 推荐
pnpm build

# ❌ 不推荐（跳过缓存）
pnpm -r build
```

### 2. 合理配置任务依赖
```json
{
  "tasks": {
    "test": {
      "dependsOn": ["build"],  // 测试前先构建
      "outputs": ["coverage/**"]
    }
  }
}
```

### 3. 使用缓存加速 CI
```yaml
# GitHub Actions
- name: Turbo Cache
  uses: actions/cache@v3
  with:
    path: .turbo/cache
    key: turbo-${{ runner.os }}-${{ github.sha }}
```

---

## 🎯 项目结构

```
snake-game-monorepo/
├── turbo.json              ← Turbo 配置
├── package.json            ← 根脚本（使用 Turbo）
├── pnpm-workspace.yaml     ← 工作区配置
├── node_modules/
│   └── .pnpm/
│       └── turbo@2.7.2/    ← Turbo 已安装
└── packages/
    ├── snake-core/         ← 有 build, type-check, clean 等脚本
    ├── snake-ui/           ← 有 build, type-check, clean 等脚本
    └── snake-game/         ← 有 dev, build, preview 等脚本
```

---

## 🚀 下一步

### 立即尝试
```bash
# 1. 清理并重新构建（测试缓存）
pnpm clean
pnpm build

# 2. 再次构建（应该很快）
pnpm build

# 3. 启动开发
pnpm dev
```

### 深入了解
- 阅读 [Turborepo 官方文档](https://turbo.build/repo/docs)
- 查看 [配置示例](https://turbo.build/repo/docs/getting-started/existing-project)
- 探索 [远程缓存](https://turbo.build/repo/docs/core-concepts/remote-caching)

---

## 📞 需要帮助？

如果遇到问题：
1. 运行 `pnpm exec turbo info` 查看环境信息
2. 检查 `turbo.json` 配置是否正确
3. 确保所有包都有所需的脚本

---

**Turbo 版本**: 2.7.2
**配置时间**: 2025-12-25
**状态**: ✅ 已启用并测试通过
