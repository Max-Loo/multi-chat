import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."


class BigModelApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://open.bigmodel.cn/api'

  getFetchApiAddress = (url: string) => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }
    return url + '/paas/v4/chat/completions'
  }
}

class BigModelFetchApi implements FetchApi {
  getFetch = () => (message: string) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(message)
      }, 2000)
    })
  }
}

class BigModel implements ModelProvider {
  readonly key = ModelProviderKeyEnum.BIG_MODEL
  readonly name = '智谱AI'
  readonly logoUrl = 'https://bigmodel.cn/favicon.ico'
  readonly officialSite = 'https://bigmodel.cn/'
  readonly apiAddress = new BigModelApiAddress()
  readonly modelList = [
    { modelKey: 'glm-4.5', modelName: 'GLM-4.5' },
    { modelKey: 'glm-4.6', modelName: 'GLM-4.6' },
  ]
  readonly fetchApi = new BigModelFetchApi()
}


class BigModelFactory implements ModelProviderFactory {
  private modelProvider: ModelProvider
  constructor () {
    this.modelProvider = new BigModel()
  }
  getModelProvider = (): ModelProvider => {
    return this.modelProvider
  }
}

// 注册到工厂函数出口里面
export const registerBigModelFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.BIG_MODEL, new BigModelFactory())
}


