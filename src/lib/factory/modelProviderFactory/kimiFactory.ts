import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."


class KimiApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://api.moonshot.cn'

  getFetchApiAddress = (url: string) => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }
    return url + '/v1/chat/completions'
  }
}

class Kimi implements ModelProvider {
  readonly key = ModelProviderKeyEnum.KIMI
  readonly name = '月之暗面'
  readonly logoUrl = 'https://kimi.moonshot.cn/favicon.ico'
  readonly officialSite = 'https://www.kimi.com/'
  readonly apiAddress = new KimiApiAddress()
  readonly modelList = [
    { modelKey: 'moonshot-v1-auto', modelName: 'moonshot-v1-auto' },
  ]
}


class KimiFactory implements ModelProviderFactory {
  private modelProvider: ModelProvider
  constructor () {
    this.modelProvider = new Kimi()
  }
  getModelProvider = (): ModelProvider => {
    return this.modelProvider
  }
}

// 注册到工厂函数出口里面
export const registerKimiFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.KIMI, new KimiFactory())
}

