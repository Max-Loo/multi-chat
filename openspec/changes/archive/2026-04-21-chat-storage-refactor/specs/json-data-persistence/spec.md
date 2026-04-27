## MODIFIED Requirements

### Requirement: 聊天数据 Store 插件存储（.json 文件）
聊天记录数据 SHALL 使用 @tauri-apps/plugin-store 存储在应用数据目录下的 `chats.json` 文件中。每个聊天以独立 key `chat_<id>` 存储，`chat_index` key 存储所有聊天的元数据索引。

#### Scenario: 应用正常保存聊天记录
- **WHEN** 用户创建新聊天、发送消息或删除聊天
- **AND** Redux middleware 触发自动保存
- **THEN** 系统 SHALL 只将受影响的聊天通过 Store 插件保存到对应的 `chat_<id>` key
- **AND** 系统 SHALL 在需要时同步更新 `chat_index` 索引
- **AND** 系统 SHALL 调用 chatsStore.set() 和 save() 保存变更
- **AND** 系统 SHALL 依赖 Store 插件确保写入的原子性

#### Scenario: 应用启动时加载聊天索引
- **WHEN** 应用启动
- **AND** chatsStore 中存在 `chat_index` key
- **THEN** 系统 SHALL 调用 chatsStore.get('chat_index') 读取索引元数据
- **AND** 系统 SHALL 过滤掉 `isDeleted: true` 的条目
- **AND** 系统 SHALL 将过滤后的元数据列表加载到 Redux store 的 chat 状态
- **AND** 系统 SHALL 不加载任何聊天的消息内容
