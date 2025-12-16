import { Outlet } from "react-router-dom"
import SettingSidebar from "./components/SettingSidebar"

const SettingPage: React.FC = () => {
  return <div className="flex items-start justify-start w-full h-full">
    <div className="w-64 h-full border-r border-gray-200">
      <SettingSidebar />
    </div>
    <div className="flex-1 w-full h-full">
      <Outlet />
    </div>
  </div>
}


export default SettingPage