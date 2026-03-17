import AnimatedLogo from "./AnimatedLogo";

/**
 * 初始化屏幕组件
 * 显示应用初始化过程中的加载动画
 */
const InitializationScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center w-full h-dvh">
      <div className="flex flex-col items-center space-y-4">
        {/* 动态 Logo 动画 */}
        <AnimatedLogo />
      </div>
    </div>
  );
};

export default InitializationScreen;
