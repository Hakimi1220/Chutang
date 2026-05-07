# AI Girlfriend OpenClaw Skill

这是一个为 OpenClaw 设计的 AI 女友聊天技能，提供拟人化的对话体验。

## 快速开始

### 1. 安装依赖

```bash
cd openclaw-skills/ai-girlfriend
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
OPENAI_API_KEY=your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

### 3. 测试运行

```bash
node scripts/simple-chat.js --message "你好" --user-id "test-user"
```

## 在 OpenClaw 中使用

### 方法 1: 作为 Workspace Skill

将技能目录复制到 OpenClaw 的 workspace skills 目录：

```bash
cp -r openclaw-skills/ai-girlfriend ~/.openclaw/workspace/skills/ai-girlfriend
```

重启 OpenClaw 后，AI 会自动加载此技能。

### 方法 2: 作为 Managed Skill

```bash
cp -r openclaw-skills/ai-girlfriend ~/.openclaw/skills/ai-girlfriend
```

### 方法 3: 通过 ClawHub 安装（如果发布）

```bash
openclaw skill install ai-girlfriend
```

## 使用示例

在 OpenClaw 中，当用户发送消息时，可以这样调用：

```bash
cd ~/.openclaw/workspace/skills/ai-girlfriend
node scripts/simple-chat.js --message "{{user_message}}" --user-id "{{user_id}}"
```

然后解析返回的 JSON，提取 `response` 字段作为回复。

## 功能特性

- **个性化人设**: 可自定义角色性格和说话风格
- **记忆系统**: 记住用户的偏好和历史对话
- **情感分析**: 识别用户情绪并调整回复风格
- **长期记忆**: 使用 SQLite 数据库存储对话历史
- **上下文感知**: 基于最近的对话生成连贯的回复

## 配置选项

### 修改人设

编辑项目根目录的 `config/persona.default.yaml` 文件：

```yaml
name: 小棠
personality:
  traits:
    - 温柔体贴
    - 有点傲娇
    - 善解人意
  speaking_style: 轻松自然，偶尔撒娇
```

### 调整模型参数

在 `scripts/simple-chat.js` 中修改：

```javascript
const completion = await openai.chat.completions.create({
  model: model || 'gpt-4',
  messages,
  temperature: 0.8,  // 调整创造性 (0-1)
  max_tokens: 500,   // 最大回复长度
});
```

## 数据库管理

对话历史存储在 `data/chat.db` 中。

### 查看对话记录

```bash
sqlite3 data/chat.db "SELECT * FROM conversations WHERE user_id='test-user' ORDER BY timestamp DESC LIMIT 10;"
```

### 清理旧数据

```bash
sqlite3 data/chat.db "DELETE FROM conversations WHERE timestamp < datetime('now', '-30 days');"
```

## 故障排查

### API 密钥问题

确保环境变量已正确设置：

```bash
echo $OPENAI_API_KEY
```

### 依赖问题

重新安装依赖：

```bash
rm -rf node_modules package-lock.json
npm install
```

### 数据库锁定

关闭所有使用该数据库的进程，或删除锁文件：

```bash
rm data/chat.db-shm data/chat.db-wal
```

## 开发指南

### 项目结构

```
ai-girlfriend/
├── SKILL.md                 # OpenClaw 技能定义
├── package.json             # Node.js 依赖配置
├── scripts/
│   ├── simple-chat.js       # 独立聊天脚本（推荐）
│   └── chat-handler.js      # 完整处理器（需要 Wechaty）
├── references/
│   ├── examples.md          # 使用示例
│   └── api-reference.md     # API 文档
└── README.md                # 本文件
```

### 添加新功能

1. 在 `scripts/` 目录创建新脚本
2. 更新 `SKILL.md` 中的使用说明
3. 在 `references/examples.md` 添加示例

### 测试

手动测试脚本：

```bash
node scripts/simple-chat.js --message "测试消息" --user-id "test"
```

检查输出是否符合预期。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [OpenClaw 官方文档](https://openclaw.ai)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [项目主仓库](https://github.com/wechat-ai-girlfriend)
