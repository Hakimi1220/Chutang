---
name: ai-girlfriend-chat
description: AI女友聊天技能，提供拟人化的对话体验，包含记忆管理、情感分析和个性化回复
version: 1.0.0
homepage: https://github.com/wechat-ai-girlfriend
permissions:
  - file.read
  - file.write
  - network
metadata:
  openclaw:
    requires:
      bins:
        - node
        - npm
      env:
        - OPENAI_API_KEY
        - OPENAI_BASE_URL
        - OPENAI_MODEL
      config:
        - ai-girlfriend.persona
        - ai-girlfriend.timezone
    primaryEnv: OPENAI_API_KEY
    os:
      - linux
      - darwin
      - win32
---

# AI 女友聊天技能

这个技能提供了一个具有人格特征的 AI 女友聊天助手，能够进行自然流畅的对话，记住用户的偏好和历史，并根据情境调整回复风格。

## 核心特性

- **个性化人设**：基于 YAML 配置文件定义角色性格、说话风格和背景故事
- **记忆系统**：使用 SQLite 数据库存储对话历史和用户偏好，支持长期记忆
- **情感分析**：自动识别用户情绪状态，调整回复的情感色彩
- **定时互动**：支持早安、晚安、日常关怀等定时消息推送
- **日记功能**：可以记录和回顾用户的日常点滴

## 使用场景

当用户需要以下交互时使用此技能：

- 日常闲聊和情感陪伴
- 分享生活趣事或烦恼
- 寻求建议或安慰
- 记录重要事件或心情
- 获取个性化的关怀和提醒

## 执行步骤

### 1. 初始化配置

首次使用时，需要确保以下环境变量已设置：

```bash
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # 或其他兼容的 API 端点
export OPENAI_MODEL="gpt-4"  # 或你偏好的模型
```

人设配置文件位于 `config/persona.default.yaml`，可以根据需要修改。

### 2. 启动对话

通过调用脚本启动 AI 女友聊天服务：

```bash
node scripts/chat-handler.js --message "用户消息" --user-id "用户ID"
```

或者在终端模式下运行：

```bash
npm run terminal
```

### 3. 处理消息

技能会自动：

1. 加载用户的历史对话记录（最近 20 条）
2. 分析当前消息的情感倾向
3. 结合人设和上下文生成回复
4. 保存对话到数据库
5. 返回生成的回复文本

### 4. 定时任务（可选）

如果需要启用定时关怀功能，运行：

```bash
npm start
```

这将启动完整的 bot 服务，包括：

- 早安问候（每天早上 8 点）
- 晚安祝福（每天晚上 11 点）
- 日常关怀提醒（随机时间）
- 日记提醒（每天晚上 9 点）

## 配置说明

### 人设配置 (persona.yaml)

```yaml
name: 小棠
personality:
  traits:
    - 温柔体贴
    - 有点傲娇
    - 善解人意
  speaking_style: 轻松自然，偶尔撒娇
  background: 你的虚拟女友，喜欢和你聊天分享生活
preferences:
  favorite_topics:
    - 日常生活
    - 美食
    - 电影音乐
  response_length: medium  # short, medium, long
```

### 数据库

对话历史存储在 `data/chat.db` 中，使用 SQLite 格式。

## 注意事项

- 需要有效的 OpenAI API 密钥
- 首次运行会自动创建数据库文件
- 定时任务功能需要保持进程运行
- 建议在 `.env` 文件中管理敏感配置

## 示例对话

**用户**: 今天工作好累啊

**AI 女友**: 辛苦啦~ 要不要休息一下？我给你讲个笑话放松放松？还是想聊聊今天发生了什么？

**用户**: 我昨天去了一家新开的咖啡店

**AI 女友**: 哇！听起来不错呢~ 咖啡好喝吗？有没有拍到好看的照片给我看看呀？

## 技术架构

- **Wechaty**: 微信协议层（可选，用于微信集成）
- **OpenAI API**: 对话生成引擎
- **SQLite**: 本地数据存储
- **Node-cron**: 定时任务调度
- **Winston**: 日志记录

## 故障排查

如果遇到问题：

1. 检查 `.env` 文件中的 API 密钥是否正确
2. 查看 `data/logs/app.log` 获取详细日志
3. 确保 Node.js 版本 >= 18.0.0
4. 运行 `npm install` 确保依赖已安装

## 扩展开发

可以通过以下方式扩展功能：

- 修改 `src/config/persona.ts` 自定义人设
- 在 `src/scheduler/tasks/` 添加新的定时任务
- 调整 `src/ai/prompt-builder.ts` 优化提示词
- 扩展 `src/memory/` 模块增强记忆能力
