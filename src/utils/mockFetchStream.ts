import { v4 as uuidV4 } from 'uuid'

interface GeneratorProps {
  message: string; // 要发送的消息
  max?: number; // 最大条数
  delay?: number; // 每条间隔（ms）
  signal?: AbortSignal; // 可中断令牌
}

interface FetchStreamProps extends GeneratorProps {
  stream?: boolean; // true=流式，false=常规
}



// 大模型生成的对话的可选项
interface ModelGeneratedChoice {
  message: string;
}

// 和大模型聊天数据的返回格式
export interface ChatModelResponse {
  // 本次对话的唯一表示
  id: string;
  choices: ModelGeneratedChoice[];
}

// 流式响应的格式
export interface ChatModelStreamResponse {
  data: ChatModelResponse
}

type MockChatModelResponse = Promise<ChatModelResponse>

type MockChatModelStreamResponse = AsyncIterable<ChatModelStreamResponse>

/* -------------------------------------------------
 * 内部公共生成器：无论哪种模式都复用同一套逻辑
 * ------------------------------------------------- */
async function* _generator({
  message,
  max = 10,
  delay = 500,
  signal,
} : GeneratorProps): MockChatModelStreamResponse {
  const id = uuidV4()

  for (let i = 1; i <= max; i++) {
    if (signal?.aborted) {
      console.warn('[mockStream] aborted');
      break;
    }

    // 异步延迟 + 可中断
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, delay);
      signal?.addEventListener('abort', () => {
        clearTimeout(t);
        resolve();
      }, { once: true });
    });

    yield { data: { id, choices: [{ message: `chunk-${i}-${message}` }] } };
  }
}

/* -------------------------------------------------
 * 对外统一函数：根据 options.stream 决定返回类型
 * ------------------------------------------------- */
export function mockFetchStream(
  options: FetchStreamProps & { stream?: false }
): MockChatModelResponse;

export function mockFetchStream(
  options: FetchStreamProps & { stream?: true }
): MockChatModelStreamResponse;

export function mockFetchStream({
  max = 10,
  delay = 500,
  signal,
  stream = false,
  message = '',
}: FetchStreamProps) {

  const asyncFetch = _generator({ message, max, delay, signal })

  if (stream) {
    // 流式：直接返回 AsyncIterable
    return asyncFetch;
  } else {
    // 常规：一次性收集到数组
    return (async () => {
      const chunkList: ChatModelStreamResponse[] = [];
      for await (const chunk of asyncFetch) {
        chunkList.push(chunk);
      }

      return {
        id: chunkList[0].data.id,
        choices: [{ message: chunkList.map(chunk => {
          return chunk.data.choices[0].message
        }).join(',') }],
      }
    })();
  }
}
