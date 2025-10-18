import React, { useEffect, useMemo } from 'react';
import ModelTable from '@/pages/Model/ModelTable';
import { useAppSelector } from '@/hooks/redux';
import { ModelPageEnum } from './utils/enums';
import AddModel from './AddModel';
import { useNavToPage } from '@/store/slices/modelPageSlice';

// 处理跳转页面逻辑的hooks
const useSwitchPage = () => {
  const { key: pageKey } = useAppSelector((state) => state.modelPage)
  const { navToTablePage } = useNavToPage()

  // 判断是渲染哪个页面
  const pageComponent = useMemo(() => {
    switch (pageKey) {
      // 跳转到添加模型页面
      case ModelPageEnum.ADD_PAGE: {
        return <AddModel />
      }
      // 跳转到模型列表页面
      case ModelPageEnum.TABLE_PAGE: {
        return <ModelTable />
      }
      default: {
        return <ModelTable />
      }
    }
  }, [pageKey])


  useEffect(() => {
    return () => {
      // 在页面销毁的时候，重置成「模型列表」页面
      navToTablePage()
    }
  }, [])

  return {
    pageKey,
    pageComponent,
  }
}

// 模型管理页面
const ModelPage: React.FC = () => {
  console.log('模型');
  
  const { pageComponent } = useSwitchPage()
  
  return (
    <div className="h-full">
      {pageComponent}
    </div>
  );
};

export default ModelPage;