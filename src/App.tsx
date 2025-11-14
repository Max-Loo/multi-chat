import { BrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import '@/App.css';
import { useInitializeAppData } from '@/hooks/useInitializeAppData';
import { App as AntdApp } from 'antd';

function App() {
  // 初始化系统数据
  useInitializeAppData()

  return (
    <AntdApp>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AntdApp>
  );
}

export default App;
