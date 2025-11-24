import { open } from '@tauri-apps/plugin-shell';


export const interceptClickAToJump = () => {
// 全局事件委托，省得给每个 <a> 绑监听
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');

    if (anchor?.href) {
      const url = new URL(anchor.href);
      // 判断是否是外部链接（非本地路由）
      if (url.origin !== window.location.origin) {
        event.preventDefault();
        await open(url.href);
      }
    }
  });
}