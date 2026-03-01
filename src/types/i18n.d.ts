import 'i18next';
import commonZh from '@/locales/zh/common.json';
import commonEn from '@/locales/en/common.json';
import chatZh from '@/locales/zh/chat.json';
import chatEn from '@/locales/en/chat.json';
import modelZh from '@/locales/zh/model.json';
import modelEn from '@/locales/en/model.json';
import settingZh from '@/locales/zh/setting.json';
import settingEn from '@/locales/en/setting.json';
import tableZh from '@/locales/zh/table.json';
import tableEn from '@/locales/en/table.json';
import navigationZh from '@/locales/zh/navigation.json';
import navigationEn from '@/locales/en/navigation.json';
import providerZh from '@/locales/zh/provider.json';
import providerEn from '@/locales/en/provider.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof commonZh;
      chat: typeof chatZh;
      model: typeof modelZh;
      setting: typeof settingZh;
      table: typeof tableZh;
      navigation: typeof navigationZh;
      provider: typeof providerZh;
    };
    returnNull: false;
  }
}
