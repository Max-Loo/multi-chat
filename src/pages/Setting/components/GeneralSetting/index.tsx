import { useScrollContainer } from "@/hooks/useScrollContainer";
import LanguageSetting from "./components/LanguageSetting";
import ModelProviderSetting from "./components/ModelProviderSetting";
import AutoNamingSetting from "./components/AutoNamingSetting";

const GeneralSetting: React.FC = () => {
  const { scrollContainerRef, scrollbarClassname } = useScrollContainer();

  return (
    <div
      ref={scrollContainerRef}
      className={`flex flex-col items-center justify-start
      w-full h-full px-4
      overflow-y-auto bg-gray-100
      ${scrollbarClassname}
    `}
    >
      <div
        className={`
      w-full p-3 my-4 bg-white rounded-xl
      flex flex-col justify-start items-center
    `}
      >
        <LanguageSetting />
      </div>

      <div
        className={`
      w-full p-3 my-4 bg-white rounded-xl
      flex flex-col justify-start items-center
    `}
      >
        <AutoNamingSetting />
      </div>

      <div
        className={`
      w-full p-3 my-4 bg-white rounded-xl
      flex flex-col justify-start items-center
    `}
      >
        <ModelProviderSetting />
      </div>
    </div>
  );
};

export default GeneralSetting;
