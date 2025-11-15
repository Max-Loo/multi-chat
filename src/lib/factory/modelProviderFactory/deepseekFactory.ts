import { ModelProviderKeyEnum } from "@/utils/enums"
import { ApiAddress, FetchApi, ModelProvider, ModelProviderFactory, ModelProviderFactoryCreator } from "."
import { ChatModelResponse, mockFetchStream } from "@/utils/mockFetchStream"
import { isNull } from "es-toolkit"


class DeepseekApiAddress implements ApiAddress {
  readonly defaultApiAddress = 'https://api.deepseek.com'

  getFetchApiAddress = (url: string) => {
    if (url?.endsWith('#')) {
      return url.slice(0, url.length - 1)
    }

    return url + '/v1/chat/completions'
  }
}

class DeepseekFetchApi implements FetchApi {
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
  private modelProvider: Deepseek = new Deepseek()
  private fetchApi: DeepseekFetchApi = new DeepseekFetchApi()

  getModelProvider = (): ModelProvider => {
    return this.modelProvider
  }

  getFetchApi = () => {
    return this.fetchApi
  }
}

// 注册函数
export const registerDeepseekFactory = () => {
  // 注册到工厂函数出口里面
  ModelProviderFactoryCreator.registerFactory(ModelProviderKeyEnum.DEEPSEEK, new DeepseekFactory())
}