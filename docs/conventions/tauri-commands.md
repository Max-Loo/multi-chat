# Tauri 命令添加指南

本文档说明如何添加新的 Tauri 命令，包括后端命令定义、前端调用和注意事项。

## 添加流程

### 步骤 1：定义后端命令

在 `src-tauri/src/lib.rs` 中使用 `#[tauri::command]` 定义命令：

```rust
use tauri::State;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn fetch_data(url: String) -> Result<String, String> {
    // 实现逻辑
    Ok(format!("Data from {}", url))
}
```

### 步骤 2：注册命令

在 `invoke_handler` 中注册命令：

```rust
fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            fetch_data,
            // ... 其他命令
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 步骤 3：前端调用

使用 `invoke()` 函数调用 Rust 命令：

```typescript
import { invoke } from '@tauri-apps/api/core';

// 调用命令
const message = await invoke('greet', { name: 'World' });
console.log(message); // "Hello, World! You've been greeted from Rust!"

// 异步命令
const data = await invoke('fetch_data', { url: 'https://api.example.com' });
console.log(data);
```

## 完整示例

### 后端（Rust）

```rust
// src-tauri/src/lib.rs

#[tauri::command]
fn calculate_sum(a: i32, b: i32) -> i32 {
    a + b
}

#[tauri::command]
async fn process_file(path: String) -> Result<String, String> {
    // 读取文件
    let content = std::fs::read_to_string(&path)
        .map_err(|e| e.to_string())?;
    
    // 处理文件内容
    let processed = content.to_uppercase();
    
    Ok(processed)
}
```

### 前端（TypeScript）

```typescript
import { invoke } from '@tauri-apps/api/core';

// 调用计算命令
const sum = await invoke('calculate_sum', { a: 10, b: 20 });
console.log(sum); // 30

// 调用异步命令
try {
  const result = await invoke('process_file', { 
    path: '/path/to/file.txt' 
  });
  console.log(result);
} catch (error) {
  console.error('处理失败:', error);
}
```

## 参数传递

### 基本类型

```rust
#[tauri::command]
fn basic_types(
    name: String,
    age: i32,
    active: bool,
) -> String {
    format!("{} is {} years old, active: {}", name, age, active)
}

// 前端调用
await invoke('basic_types', {
  name: 'Alice',
  age: 30,
  active: true
});
```

### 可选参数

```rust
#[tauri::command]
fn optional_param(name: String, age: Option<i32>) -> String {
    match age {
        Some(age) => format!("{} is {} years old", name, age),
        None => format!("{}'s age is unknown", name),
    }
}

// 前端调用
await invoke('optional_param', {
  name: 'Bob',
  age: 25 // 可选
});

// 或者
await invoke('optional_param', {
  name: 'Bob'
  // 不传 age
});
```

### 复杂对象

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct User {
    name: String,
    age: i32,
    email: String,
}

#[tauri::command]
fn create_user(user: User) -> String {
    format!("Created user: {}", user.name)
}

// 前端调用
await invoke('create_user', {
  user: {
    name: 'Charlie',
    age: 35,
    email: 'charlie@example.com'
  }
});
```

## 错误处理

### 返回 Result

```rust
#[tauri::command]
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// 前端调用
try {
  const result = await invoke('divide', { a: 10, b: 2 });
  console.log(result); // 5
} catch (error) {
  console.error('错误:', error); // "Division by zero"
}
```

### 自定义错误类型

```rust
#[derive(Debug)]
enum MyError {
    InvalidInput(String),
    NotFound(String),
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            MyError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
            MyError::NotFound(msg) => write!(f, "Not found: {}", msg),
        }
    }
}

impl From<MyError> for String {
    fn from(error: MyError) -> String {
        error.to_string()
    }
}

#[tauri::command]
fn validate_input(input: String) -> Result<String, MyError> {
    if input.is_empty() {
        Err(MyError::InvalidInput("Input cannot be empty".to_string()))
    } else {
        Ok(input)
    }
}
```

## 异步命令

### 使用 async

```rust
#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let response = reqwest::get(&url).await
        .map_err(|e| e.to_string())?;
    
    let text = response.text().await
        .map_err(|e| e.to_string())?;
    
    Ok(text)
}

// 前端调用
const html = await invoke('fetch_url', { 
  url: 'https://example.com' 
});
```

### 使用 tokio::spawn

```rust
#[tauri::command]
async fn background_task(app_handle: tauri::AppHandle) -> String {
    let handle = app_handle.clone();
    
    tauri::async_runtime::spawn(async move {
        // 后台任务
        println!("Background task running");
    });
    
    "Task started".to_string()
}
```

## 状态管理

### 使用 State

```rust
struct Database {
    connections: i32,
}

#[tauri::command]
fn get_connections(state: State<'_, Database>) -> i32 {
    state.connections
}

// 在 main 中创建状态
fn main() {
    let db = Database {
        connections: 10
    };
    
    tauri::Builder::default()
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            get_connections
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 类型映射

### Rust 到 TypeScript

| Rust 类型 | TypeScript 类型 |
|----------|---------------|
| `String` | `string` |
| `i32`, `i64` | `number` |
| `f32`, `f64` | `number` |
| `bool` | `boolean` |
| `Vec<T>` | `T[]` |
| `HashMap<K, V>` | `Record<K, V>` |
| `Option<T>` | `T \| null` |
| `Result<T, E>` | `T` (throws error) |

## 注意事项

### 1. 命名约定

- ✅ 使用 snake_case：`fetch_data`
- ❌ 避免 camelCase：`fetchData`

### 2. 错误处理

- ✅ 返回 `Result<T, String>`
- ❌ 不要使用 `panic!()` 或 `unwrap()`

### 3. 性能考虑

- ✅ 使用 `async` 处理耗时操作
- ❌ 不要在命令中执行阻塞操作

### 4. 安全性

- ✅ 验证输入参数
- ❌ 不要直接执行用户输入的命令

### 5. 类型安全

- ✅ 使用强类型
- ✅ 定义结构体处理复杂对象

## 测试

### 单元测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_sum() {
        assert_eq!(calculate_sum(2, 3), 5);
    }

    #[test]
    fn test_divide_by_zero() {
        assert!(divide(10, 0).is_err());
    }
}
```

### 前端测试

```typescript
// Mock Tauri invoke
const mockInvoke = jest.fn();
jest.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

test('should call greet command', async () => {
  mockInvoke.mockResolvedValue('Hello, Test!');
  
  const result = await invoke('greet', { name: 'Test' });
  
  expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'Test' });
  expect(result).toBe('Hello, Test!');
});
```

## 相关资源

- **Tauri Commands 文档**：https://tauri.app/v1/guides/features/command
- ** invoke API 文档**：https://tauri.app/v1/api/js/modules/invok/

## 常见问题

### Q: 如何传递回调函数？

A: Tauri 不支持直接传递回调函数。考虑使用事件监听器或返回 Promise。

### Q: 如何上传文件？

A: 使用 Tauri 的文件系统 API 或将文件转换为 Base64 字符串传递。

### Q: 如何处理大量数据？

A: 考虑分块传输或使用流式处理，避免一次性传递大量数据。
