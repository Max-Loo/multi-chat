import { ModelProviderKeyEnum } from "@/utils/enums";

// 由系统生成的AI模型的相关参数类型
export interface SystemConfigModel {
  // 模型唯一标识符
  id: string;
  // 创建时间，格式：YYYY-MM-dd HH:mm:ss
  createdAt: string;
  // 最近一次的更新时间，格式：YYYY-MM-dd HH:mm:ss
  updateAt: string;
  // 服务商的名称（如深度求索、月之暗面）
  providerName: string;
  // 服务商的标识
  providerKey: ModelProviderKeyEnum;
}

// 由用户填写或者选择的AI模型的相关参数类型
export interface ManualConfigModel {
  // 用户自定义的模型昵称
  nickname: string;
  // 具体模型的名称（如deepseek v3.1）
  modelName: string;
  // 具体模型的标识
  modelKey: string;
  // API 密钥
  apiKey: string;
  // API 地址
  apiAddress: string;
  // 备注信息（可选）
  remark?: string;
}


// AI模型对象相关参数类型（完整的）
export interface Model extends SystemConfigModel, ManualConfigModel {}


// 默认的可选模型列表
export interface ModelDetail {
  // 具体模型的名称（如deepseek v3.1）
  modelName: string;
  // 具体模型的标识
  modelKey: string;
}

// 大模型服务商所支持的默认配置
export interface DefaultModelProviderConfig {
  // api调用地址
  apiAddress: string;
  // 可选择的模型
  modelList: ModelDetail[];
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
  // 默认的相关配置
  defaultConfig: DefaultModelProviderConfig
}

// 模型管理状态接口定义
export interface ModelState {
  models: Model[]; // 所有模型列表
  loading: boolean; // 加载状态
  error: string | null; // 操作错误信息
  initializationError: string | null; // 初始化错误信息
}