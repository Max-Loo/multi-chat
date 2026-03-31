import React, { useState } from "react";
import ModelSidebar from "./components/ModelSidebar";
import ModelHeader from "./components/ModelHeader";
import { ModelProviderKeyEnum } from "@/utils/enums";
import ModelConfigForm from "../components/ModelConfigForm";
import { Model } from "@/types/model";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createModel } from "@/store/slices/modelSlice";
import { setIsDrawerOpen } from "@/store/slices/modelPageSlices";
import { useResponsive } from "@/hooks/useResponsive";
import { MobileDrawer } from "@/components/MobileDrawer";
import { useTranslation } from "react-i18next";
import { toastQueue } from '@/services/toast';
import { useAdaptiveScrollbar } from "@/hooks/useAdaptiveScrollbar";

/**
 * 添加模型页面
 * @description 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
const CreateModel: React.FC = () => {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();

  const [selectedModelProviderKey, setSelectedModelProviderKey] = useState(
    ModelProviderKeyEnum.DEEPSEEK,
  );

  const isDrawerOpen = useAppSelector((state) => state.modelPage.isDrawerOpen);

  /**
   * @description 处理抽屉打开/关闭状态变化
   */
  const handleDrawerOpenChange = (open: boolean) => {
    dispatch(setIsDrawerOpen(open));
  };

  /**
   * @description 表单校验完成后的回调
   */
  const onFormFinish = (model: Model): void => {
    try {
      dispatch(
        createModel({
          model,
        }),
      );

      toastQueue.success(t(($) => $.model.addModelSuccess));
      // 返回到列表页面
      navigate("/model/table");
    } catch {
      toastQueue.error(t(($) => $.model.addModelFailed));
    }
  };

  return (
    <div className="flex items-start justify-start h-full w-full">
      {/* 移动端：抽屉 */}
      {isMobile && (
        <>
          <MobileDrawer
            isOpen={isDrawerOpen}
            onOpenChange={handleDrawerOpenChange}
            showCloseButton={false}
          >
            <ModelSidebar
              value={selectedModelProviderKey}
              onChange={setSelectedModelProviderKey}
            />
          </MobileDrawer>
          <ModelHeader />
        </>
      )}

      {/* 桌面端：直接显示侧边栏（无折叠功能） */}
      {!isMobile && (
        <div className="h-full border-r border-gray-200 shrink-0">
          <ModelSidebar
            value={selectedModelProviderKey}
            onChange={setSelectedModelProviderKey}
          />
        </div>
      )}

      {/* 主内容区域 */}
      <div
        className={`flex-1 w-full h-full overflow-y-auto p-4 ${isMobile && "mt-12"} ${scrollbarClassname}`}
        onScroll={onScrollEvent}
      >
        <ModelConfigForm
          modelProviderKey={selectedModelProviderKey}
          onFinish={onFormFinish}
        />
      </div>
    </div>
  );
};

export default CreateModel;
