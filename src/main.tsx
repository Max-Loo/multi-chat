import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "@/store";
import App from "./App";
import { registerAllFactory } from "./lib/factory";
import { interceptClickAToJump } from "./lib/global";

registerAllFactory()
interceptClickAToJump()

// 渲染应用到DOM
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
