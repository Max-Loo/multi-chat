import { MetadataCollectionError } from '@/services/chat/types';
import type { StandardMessageRawResponse } from '@/types/chat';

// 定义 AI SDK streamText 返回类型的 await 结果
type StreamResultMetadata = {
  providerMetadata: Promise<Record<string, Record<string, unknown>>>;
  warnings: Promise<Array<unknown>>;
  sources: Promise<Array<unknown>>;
  response: { id: string; modelId: string; timestamp: Date; headers?: Record<string, unknown> };
  request: { body: unknown };
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; inputTokenDetails?: object; outputTokenDetails?: object; raw?: object };
  finishReason?: Promise<string | null>;
  rawFinishReason?: Promise<string | null>;
};

// 定义 streamText 返回类型
type StreamResult = PromiseLike<StreamResultMetadata> & AsyncIterable<unknown>;

/**
 * 收集所有元数据
 * @param result AI SDK 流式结果
 * @returns 标准消息原始响应对象
 * @throws 当关键元数据收集失败时抛出错误
 */
export async function collectAllMetadata(
  result: StreamResult
): Promise<StandardMessageRawResponse> {
  const metadata = await result;

  // 并行收集可能抛错的异步元数据（提升性能）
  const [providerMetadata, warnings, sources, finishReasonMetadata] = await Promise.all([
    collectProviderMetadata(metadata),
    collectWarnings(metadata),
    collectSources(metadata),
    collectFinishReasonMetadata(metadata),
  ]);

  // 同步收集（不会抛错）或计算型元数据
  const responseMetadata = collectResponseMetadata(metadata);
  const requestMetadata = collectRequestMetadata(metadata);
  const usageMetadata = collectUsageMetadata(metadata);
  const streamStats = collectStreamStats(metadata);

  return {
    response: responseMetadata,
    request: requestMetadata,
    usage: usageMetadata,
    finishReason: finishReasonMetadata,
    providerMetadata,
    warnings,
    sources,
    streamStats,
  };
}

/**
 * 收集供应商元数据
 * @param metadata AI SDK 元数据
 * @returns 供应商特定元数据
 * @throws 当收集失败时抛出 MetadataCollectionError
 */
export async function collectProviderMetadata(
  metadata: StreamResultMetadata
): Promise<Record<string, Record<string, unknown>>> {
  try {
    return await metadata.providerMetadata;
  } catch (error) {
    throw new MetadataCollectionError(
      'providerMetadata',
      error instanceof Error ? error.message : String(error),
      error
    );
  }
}

/**
 * 收集警告信息
 * @param metadata AI SDK 元数据
 * @returns 警告数组
 * @throws 当收集失败时抛出 MetadataCollectionError
 */
export async function collectWarnings(
  metadata: StreamResultMetadata
): Promise<Array<{ code?: string; message: string }>> {
  try {
    const rawWarnings = await metadata.warnings;
    return rawWarnings?.map((w: unknown) => {
      const warning = w as { code?: unknown; message?: unknown; type?: string; feature?: string; details?: string };
      return {
        code: 'code' in warning ? String(warning.code) : warning.type,
        message: 'message' in warning && typeof warning.message === 'string'
          ? warning.message
          : `${warning.type}: ${warning.feature}${warning.details ? ` (${warning.details})` : ''}`,
      };
    }) ?? [];
  } catch (error) {
    throw new MetadataCollectionError('warnings', error instanceof Error ? error.message : String(error), error);
  }
}

/**
 * 收集来源信息
 * @param metadata AI SDK 元数据
 * @returns 来源数组或 undefined
 * @throws 当收集失败时抛出 MetadataCollectionError
 */
export async function collectSources(
  metadata: StreamResultMetadata
): Promise<Array<{ sourceType: 'url'; id: string; url: string; title?: string; providerMetadata?: Record<string, unknown> }> | undefined> {
  try {
    const rawSources = await metadata.sources;
    const transformedSources = rawSources
      ?.filter((s: unknown) => {
        const source = s as { sourceType?: string };
        return source.sourceType === 'url';
      })
      .map((s: unknown) => {
        const source = s as { sourceType: string; id: string; url: string; title?: string; providerMetadata?: Record<string, unknown> };
        return {
          sourceType: source.sourceType as 'url',
          id: source.id,
          url: source.url,
          title: source.title,
          providerMetadata: source.providerMetadata,
        };
      });
    // 空数组转换为 undefined
    return transformedSources && transformedSources.length > 0 ? transformedSources : undefined;
  } catch (error) {
    throw new MetadataCollectionError('sources', error instanceof Error ? error.message : String(error), error);
  }
}

/**
 * 收集响应元数据
 * @param metadata AI SDK 元数据
 * @returns 响应元数据（过滤敏感 headers）
 */
export function collectResponseMetadata(
  metadata: StreamResultMetadata
): { id: string; modelId: string; timestamp: string; headers?: Record<string, string> } {
  const responseData = metadata.response;
  const headers = responseData.headers
    ? Object.fromEntries(
        Object.entries(responseData.headers).filter(([key]) => 
          !['authorization', 'Authorization', 'x-api-key', 'X-API-Key'].includes(key)
        ).map(([key, value]) => [key, String(value)])
      )
    : undefined;

  return {
    id: responseData.id,
    modelId: responseData.modelId,
    timestamp: responseData.timestamp instanceof Date 
      ? responseData.timestamp.toISOString()
      : new Date().toISOString(),
    headers,
  };
}

/**
 * 收集请求元数据
 * @param metadata AI SDK 元数据
 * @returns 请求元数据（脱敏 + 截断）
 */
export function collectRequestMetadata(
  metadata: StreamResultMetadata
): { body: string } {
  const requestData = metadata.request;

  // 处理请求体：可能是 undefined、字符串或对象
  let requestBody: string;
  if (requestData.body === undefined) {
    requestBody = '{}'; // 默认空对象
  } else if (typeof requestData.body === 'string') {
    requestBody = requestData.body;
  } else {
    requestBody = JSON.stringify(requestData.body);
  }

  // 确保 requestBody 是字符串（JSON.stringify 可能返回 undefined）
  if (typeof requestBody !== 'string' || requestBody === 'undefined') {
    requestBody = '{}';
  }

  // 移除敏感字段
  try {
    const parsedBody = JSON.parse(requestBody) as Record<string, unknown>;
    if (parsedBody.apiKey) delete parsedBody.apiKey;
    if (parsedBody.api_key) delete parsedBody.api_key;
    if (parsedBody.authorization) delete parsedBody.authorization;
    if (parsedBody.Authorization) delete parsedBody.Authorization;
    requestBody = JSON.stringify(parsedBody);
  } catch {
    // 如果解析失败，保持原始字符串
  }

  // 限制请求体大小（10KB）
  const MAX_BODY_SIZE = 10240;
  if (requestBody.length > MAX_BODY_SIZE) {
    requestBody = requestBody.substring(0, MAX_BODY_SIZE) + '... (truncated)';
  }

  return { body: requestBody };
}

/**
 * 收集使用量元数据
 * @param metadata AI SDK 元数据
 * @returns 使用量元数据
 */
export function collectUsageMetadata(
  metadata: StreamResultMetadata
): { inputTokens: number; outputTokens: number; totalTokens: number; inputTokenDetails?: object; outputTokenDetails?: object; raw?: Record<string, unknown> } {
  const usage = metadata.usage;
  return {
    inputTokens: usage?.inputTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    inputTokenDetails: usage?.inputTokenDetails,
    outputTokenDetails: usage?.outputTokenDetails,
    raw: usage?.raw as Record<string, unknown> | undefined,
  };
}

/**
 * 收集完成原因元数据
 * @param metadata AI SDK 元数据
 * @returns 完成原因元数据
 * @throws 当收集失败时抛出 MetadataCollectionError
 */
export async function collectFinishReasonMetadata(
  metadata: StreamResultMetadata
): Promise<{ reason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other'; rawReason?: string }> {
  try {
    const finalFinishReason = await metadata.finishReason;
    const rawFinishReason = await metadata.rawFinishReason;
    return {
      reason: (finalFinishReason ?? 'other') as 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other',
      rawReason: rawFinishReason ?? undefined,
    };
  } catch (error) {
    throw new MetadataCollectionError(
      'finishReason',
      error instanceof Error ? error.message : String(error),
      error
    );
  }
}

/**
 * 收集流式统计
 * @param _metadata AI SDK 元数据（未使用，保留参数以保持接口一致性）
 * @returns 流式统计（基础实现）
 */
export function collectStreamStats(
  _metadata: StreamResultMetadata
): { textDeltaCount: number; reasoningDeltaCount: number; duration: number } {
  // 流式统计需要在流式处理过程中计算
  // 这里返回默认值，实际统计在 streamProcessor 中完成
  return {
    textDeltaCount: 0,
    reasoningDeltaCount: 0,
    duration: 0,
  };
}
