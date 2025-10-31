// 模型供应商的标识的枚举值
export const enum ModelProviderKeyEnum {
  DEEPSEEK = 'deepseek',
  KIMI = 'kimi',
  BIG_MODEL = 'bigmodel',
  OPEN_AI = 'openai',
}

// 常用的日期时间格式
export const enum DateFormatEnum {
  DAY = 'YYYY-MM-DD',
  TIME = 'HH:mm:ss',
  DAY_AND_TIME = DAY + ' ' + TIME
}