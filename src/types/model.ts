import { ModelProviderKeyEnum } from "@/utils/enums";

// AI模型接口定义
export interface Model {
  id: string; // 模型唯一标识符
  nickname: string; // 用户自定义的模型昵称
  provider: string; // 大模型服务商标识
  modelName: string; // 模型名称
  createdAt: string; // 创建时间，格式：yyyy-MM-dd HH:mm:ss
  remark?: string; // 备注信息（可选）
}

// 大模型服务商接口定义
export interface ModelProvider {
  // 大模型服务商唯一标识
  key: ModelProviderKeyEnum;
  // 大模型服务商显示名称
  name: string;
  // 大模型服务商logo URL（可选）
  logoUrl?: string;
  // 官网地址
  officialSite?: string;
  // 默认的api调用地址
  defaultApiAddress: string;
}

// 模型管理状态接口定义
export interface ModelState {
  models: Model[]; // 所有模型列表
  loading: boolean; // 加载状态
  error: string | null; // 操作错误信息
  initializationError: string | null; // 初始化错误信息
}