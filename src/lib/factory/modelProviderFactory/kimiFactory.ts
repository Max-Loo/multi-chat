import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { mockFetchStream } from "@/utils/mockFetchStream"
import { isString } from "es-toolkit"


class KimiApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://api.moonshot.cn'

  getOpenaiDisplayAddress = (url: string) => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }

    return this.getOpenaiFetchAddress(url) + 'chat/completions'
  }

  getOpenaiFetchAddress = (url: string) => {
    let actualUrl = url

    // 默认会填充 预设的地址
    if (!isString(actualUrl)) {
      actualUrl = this.defaultApiAddress
    }

    if (actualUrl.endsWith('#')) {
      actualUrl = actualUrl.slice(0, actualUrl.length - 1)
    } else if (!actualUrl.endsWith('/')) {
      actualUrl += '/v1/'
    }

    return actualUrl
  }
}

class KimiFetchApi implements FetchApi {
  fetch = async function*(message: string, { signal }: { signal?: AbortSignal } = {}) {
    const res = await mockFetchStream({
      message,
      max: 10,
      delay: 500,
      signal,
      stream: true,
    })
    yield JSON.stringify(res)
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
  private modelProvider = new Kimi()
  private fetchApi = new KimiFetchApi()

  getModelProvider = () => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }
}

// 注册到工厂函数出口里面
export const registerKimiFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.KIMI, new KimiFactory())
}

