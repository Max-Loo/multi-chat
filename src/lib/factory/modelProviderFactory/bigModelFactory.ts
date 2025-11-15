import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { ChatModelResponse, mockFetchStream } from "@/utils/mockFetchStream"
import { isNull } from "es-toolkit"


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


