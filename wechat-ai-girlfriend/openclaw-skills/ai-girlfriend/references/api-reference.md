# AI Girlfriend Skill API 参考

## 脚本接口

### simple-chat.js

独立的聊天处理器，不依赖 Wechaty，专为 OpenClaw 设计。

#### 命令行参数

| 参数 | 简写 | 类型 | 必填 | 说明 |
|------|------|------|------|------|
| --message | -m | string | 是 | 用户发送的消息内容 |
| --user-id | -u | string | 是 | 用户的唯一标识符 |
| --help | -h | boolean | 否 | 显示帮助信息 |

#### 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| OPENAI_API_KEY | 是 | - | OpenAI API 密钥 |
| OPENAI_BASE_URL | 否 | https://api.openai.com/v1 | API 基础 URL |
| OPENAI_MODEL | 否 | gpt-4 | 使用的模型名称 |

#### 返回值格式

成功时：
```json
{
  "success": true,
  "response": "AI 生成的回复文本",
  "emotion": "positive|negative|neutral",
  "contextLength": 5
}
```

失败时：
```json
{
  "success": false,
  "error": "错误描述信息"
}
```

#### 使用示例

```bash
# 基本用法
node scripts/simple-chat.js --message "你好" --user-id "user123"

# 指定自定义 API 端点
OPENAI_BASE_URL=https://api.example.com/v1 \
node scripts/simple-chat.js --message "你好" --user-id "user123"

# 使用不同的模型
OPENAI_MODEL=gpt-3.5-turbo \
node scripts/simple-chat.js --message "你好" --user-id "user123"
```

### chat-handler.js

完整的消息处理器，包含项目的所有功能（需要 Wechaty 依赖）。

#### 适用场景

- 需要完整的定时任务功能
- 需要集成微信机器人
- 需要使用项目的全部模块

#### 注意事项

此脚本依赖于完整的项目结构，包括：
- src/ 目录下的所有模块
- node_modules 中的依赖包
- 配置文件

建议仅在完整项目环境中使用。

## 数据库结构

### conversations 表

存储对话历史。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | TEXT | 用户 ID |
| role | TEXT | 角色：user 或 assistant |
| content | TEXT | 消息内容 |
| timestamp | DATETIME | 时间戳 |
| emotion | TEXT | 情感标签（可选） |

#### 查询示例

```sql
-- 获取用户最近的 10 条对话
SELECT * FROM conversations 
WHERE user_id = 'user123' 
ORDER BY timestamp DESC 
LIMIT 10;

-- 统计用户的对话数量
SELECT COUNT(*) FROM conversations 
WHERE user_id = 'user123';

-- 删除特定用户的旧对话（保留最近 50 条）
DELETE FROM conversations 
WHERE user_id = 'user123' 
AND id NOT IN (
  SELECT id FROM conversations 
  WHERE user_id = 'user123' 
  ORDER BY timestamp DESC 
  LIMIT 50
);
```

### user_preferences 表

存储用户偏好设置。

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | TEXT | 主键，用户 ID |
| preferences | TEXT | JSON 格式的偏好设置 |
| updated_at | DATETIME | 更新时间 |

## 人设配置

### persona.default.yaml 结构

```yaml
name: string              # AI 的名字
personality:
  traits: string[]        # 性格特点列表
  speaking_style: string  # 说话风格描述
  background: string      # 背景故事
preferences:
  favorite_topics: string[]  # 喜欢的话题
  response_length: string    # 回复长度：short/medium/long
```

### 性格特点建议

有效的性格特点包括：

- 温柔体贴
- 活泼开朗
- 有点傲娇
- 善解人意
- 幽默风趣
- 知性优雅
- 可爱天真
- 成熟稳重

### 说话风格示例

- 轻松自然，偶尔撒娇
- 正式礼貌，用词精准
- 俏皮可爱，喜欢用表情
- 简洁直接，不啰嗦
- 文艺清新，富有诗意

## 情感分析

### 支持的情感类型

- **positive**: 积极情绪（开心、兴奋、满意）
- **negative**: 消极情绪（难过、生气、疲惫）
- **neutral**: 中性情绪（平静、客观陈述）

### 情感关键词

#### 积极词汇
- 开心、高兴、快乐、喜欢、爱、棒、好、赞、幸福、满足

#### 消极词汇
- 难过、伤心、生气、烦、累、讨厌、失望、痛苦、焦虑

### 使用情感标签

可以根据情感调整回复策略：

```javascript
if (emotion === 'negative') {
  // 给予安慰和支持
  prompt += "\n用户现在情绪低落，请给予温暖的安慰。";
} else if (emotion === 'positive') {
  // 分享喜悦
  prompt += "\n用户心情很好，一起庆祝吧！";
}
```

## 提示词工程

### 系统提示词结构

```
你是{name}，一个AI女友助手。

性格特点：
{traits}

说话风格：{speaking_style}

重要规则：
1. 禁止使用任何形式的括号来描述动作、情感或事件
2. 保持对话自然流畅，像真实的人一样交流
3. 根据上下文和用户情绪调整回复风格
4. 记住用户的偏好和之前聊过的内容
5. 回复要简洁自然，不要过于冗长

请根据以下对话历史和用户消息，生成合适的回复：
```

### 优化建议

1. **明确禁止的行为**: 在提示词中清楚说明不允许的做法
2. **提供示例**: 给出几个好的回复示例
3. **设定边界**: 明确 AI 的角色和能力范围
4. **强调一致性**: 要求保持人格特征的一致性

### 上下文管理

推荐的上下文窗口大小：

- **短期记忆**: 最近 10-20 条消息
- **长期记忆**: 通过数据库查询关键信息
- **摘要机制**: 对于长对话，可以生成摘要减少 token 使用

## 性能指标

### 响应时间

- API 调用: 1-3 秒（取决于网络和模型）
- 数据库操作: < 100 毫秒
- 总响应时间: 2-5 秒

### Token 使用

- 系统提示词: ~200 tokens
- 每条历史消息: ~50-100 tokens
- 用户消息: ~20-50 tokens
- AI 回复: ~50-200 tokens

**建议**: 保持历史消息在 20 条以内，以控制成本。

### 成本估算

以 GPT-4 为例（价格可能变化）：

- 输入: $0.03 / 1K tokens
- 输出: $0.06 / 1K tokens

单次对话成本约: $0.005 - $0.02

## 安全考虑

### API 密钥管理

- 永远不要在代码中硬编码 API 密钥
- 使用环境变量或 .env 文件
- 将 .env 添加到 .gitignore
- 定期轮换 API 密钥

### 数据隐私

- 对话数据存储在本地 SQLite 数据库
- 不要上传敏感信息到云端
- 定期清理旧的对话记录
- 考虑加密敏感数据

### 内容过滤

建议在应用层添加内容过滤：

```javascript
function filterContent(text) {
  const blockedWords = ['敏感词1', '敏感词2'];
  
  for (const word of blockedWords) {
    if (text.includes(word)) {
      return false;
    }
  }
  
  return true;
}
```

## 故障排除

### 常见问题

#### 1. "Cannot find module 'openai'"

**原因**: 依赖未安装

**解决**:
```bash
npm install openai better-sqlite3
```

#### 2. "database is locked"

**原因**: 多个进程同时访问数据库

**解决**:
- 确保只有一个实例在运行
- 使用数据库连接池
- 添加重试逻辑

#### 3. "Invalid API key"

**原因**: API 密钥错误或过期

**解决**:
- 检查 OPENAI_API_KEY 环境变量
- 在 OpenAI 控制台验证密钥状态
- 确认有足够的使用配额

#### 4. 回复速度慢

**原因**: 网络延迟或模型负载高

**解决**:
- 使用更快的模型（如 gpt-3.5-turbo）
- 减少上下文长度
- 添加超时和重试机制

## 最佳实践

1. **错误处理**: 始终捕获和处理异常
2. **日志记录**: 记录关键操作和错误
3. **资源清理**: 及时关闭数据库连接
4. **输入验证**: 验证用户输入的有效性
5. **限流保护**: 避免频繁调用 API
6. **备份数据**: 定期备份 SQLite 数据库
7. **监控性能**: 跟踪响应时间和错误率
8. **用户反馈**: 收集用户对回复质量的反馈
