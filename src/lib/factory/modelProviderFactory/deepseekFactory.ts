import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."


class DeepseekApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://api.deepseek.com'

  getFetchApiAddress = (url: string) => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }

    return url + '/v1/chat/completions'
  }
}

class Deepseek implements ModelProvider {
  readonly key = ModelProviderKeyEnum.DEEPSEEK
  readonly name = '深度求索'
  readonly logoUrl = 'https://deepseek.com/favicon.ico'
  readonly officialSite = 'https://www.deepseek.com/'
  readonly apiAddress = new DeepseekApiAddress()
  readonly modelList = [
    { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
    { modelKey: 'deepseek-reasoner', modelName: 'DeepSeek Reasoner' },
  ]
}


class DeepseekFactory implements ModelProviderFactory {
  createModelProvider = (): ModelProvider => {
    return new Deepseek()
  }
}

// 注册函数
export const registerDeepseekFactory = () => {
  // 注册到工厂函数出口里面
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.DEEPSEEK, new DeepseekFactory())
}