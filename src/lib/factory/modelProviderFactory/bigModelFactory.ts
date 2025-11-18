import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { ChatModelResponse, mockFetchStream } from "@/utils/mockFetchStream"
import { isNull, isString } from "es-toolkit"


class BigModelApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://open.bigmodel.cn/api/paas/v4/'

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

class BigModelFetchApi implements FetchApi {
  fetch = async function*(message: string, { signal }: { signal?: AbortSignal } = {}) {
    const fetchResponse = mockFetchStream({
      message,
      max: 10,
      delay: 500,
      signal,
      stream: true,
    })

    let tempRes: ChatModelResponse | null = null

    for await (const element of fetchResponse) {
      if (isNull(tempRes)) {
        tempRes = element.data
      } else {
        tempRes.choices[0].message += element.data.choices[0].message
      }

      yield JSON.stringify(tempRes)
    }

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
}


class BigModelFactory implements ModelProviderFactory {
  private modelProvider = new BigModel()
  private fetchApi = new BigModelFetchApi()
  getModelProvider = () => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }
}

// 注册到工厂函数出口里面
export const registerBigModelFactory = () => {
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.BIG_MODEL, new BigModelFactory())
}


