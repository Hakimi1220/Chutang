# AI Girlfriend Skill 使用示例

## 基本对话

### 示例 1: 日常问候

**输入**:
```bash
node scripts/simple-chat.js --message "早上好" --user-id "user001"
```

**预期输出**:
```json
{
  "success": true,
  "response": "早安呀~ 昨晚睡得好吗？今天有什么计划呢？",
  "emotion": "neutral",
  "contextLength": 0
}
```

### 示例 2: 分享心情

**输入**:
```bash
node scripts/simple-chat.js --message "今天工作好累啊" --user-id "user001"
```

**预期输出**:
```json
{
  "success": true,
  "response": "辛苦啦~ 要不要休息一下？我给你讲个笑话放松放松？还是想聊聊今天发生了什么？",
  "emotion": "negative",
  "contextLength": 1
}
```

### 示例 3: 连续对话

第一次对话:
```bash
node scripts/simple-chat.js --message "我昨天去了一家新开的咖啡店" --user-id "user001"
```

第二次对话（会记住之前的内容）:
```bash
node scripts/simple-chat.js --message "咖啡很好喝" --user-id "user001"
```

**预期输出**:
```json
{
  "success": true,
  "response": "哇！听起来不错呢~ 是什么口味的咖啡呀？下次我们也一起去好不好？",
  "emotion": "positive",
  "contextLength": 3
}
```

## OpenClaw 集成示例

在 OpenClaw 的 SKILL.md 中调用：

```markdown
## 使用 AI 女友聊天

当用户想要聊天时，执行以下命令：

```bash
cd /path/to/wechat-ai-girlfriend/openclaw-skills/ai-girlfriend
node scripts/simple-chat.js --message "{{user_message}}" --user-id "{{user_id}}"
```

然后解析返回的 JSON，提取 `response` 字段作为回复。
```

## 环境变量配置

创建 `.env` 文件：

```bash
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

加载环境变量：

```bash
export $(cat .env | xargs)
```

## 自定义人设

编辑 `config/persona.default.yaml`：

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
  response_length: medium
```

## 查看对话历史

直接查询 SQLite 数据库：

```bash
sqlite3 data/chat.db "SELECT * FROM conversations WHERE user_id='user001' ORDER BY timestamp DESC LIMIT 10;"
```

## 故障排查

### 问题 1: API 密钥错误

**症状**: 返回错误 "Invalid API key"

**解决**: 
```bash
echo $OPENAI_API_KEY  # 检查是否设置
export OPENAI_API_KEY="your-key"  # 重新设置
```

### 问题 2: 数据库锁定

**症状**: "database is locked"

**解决**:
```bash
# 确保没有其他进程在使用数据库
lsof data/chat.db
# 如果有，关闭相关进程
```

### 问题 3: Node.js 版本过低

**症状**: "SyntaxError: Unexpected token import"

**解决**:
```bash
node --version  # 检查版本
# 需要 >= 18.0.0
# 升级 Node.js
```

## 性能优化建议

1. **缓存常用回复**: 对于常见问题，可以缓存回复减少 API 调用
2. **调整上下文长度**: 根据需求调整 `getConversationHistory` 中的 limit 参数
3. **使用更快的模型**: 如果需要快速响应，可以使用 gpt-3.5-turbo
4. **批量处理**: 如果需要处理多条消息，考虑批量调用

## 扩展功能

### 添加情感标签

修改 `analyzeEmotion` 函数，支持更多情感类型：

```javascript
function analyzeEmotion(text) {
  const emotions = {
    happy: ['开心', '高兴', '快乐', '喜欢'],
    sad: ['难过', '伤心', '失落'],
    angry: ['生气', '愤怒', '烦'],
    tired: ['累', '疲惫', '困'],
  };
  
  for (const [emotion, words] of Object.entries(emotions)) {
    if (words.some(word => text.includes(word))) {
      return emotion;
    }
  }
  
  return 'neutral';
}
```

### 添加定时提醒

使用 node-cron 创建定时任务：

```javascript
import cron from 'node-cron';

// 每天早上 8 点发送早安
cron.schedule('0 8 * * *', () => {
  console.log('发送早安消息');
  // 调用聊天函数生成个性化早安消息
});
```

### 集成图片识别

如果用户上传了图片，可以先使用视觉模型分析图片内容：

```javascript
async function analyzeImage(imageUrl) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "描述这张图片" },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ]
  });
  
  return response.choices[0].message.content;
}
```
