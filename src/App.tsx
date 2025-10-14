import { BrowserRouter } from 'react-router-dom';
import Layout from '@/components/Layout';
import '@/App.css';
import { useInitializeAppData } from '@/hooks/useInitializeAppData';

function App() {
  // 初始化系统数据
  useInitializeAppData()

  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
