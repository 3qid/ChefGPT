import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google"; // 1. استيراد المكتبة
import App from "./App.jsx";

// استبدل 'YOUR_GOOGLE_CLIENT_ID' بالكود الحقيقي الذي حصلت عليه من جوجل
const GOOGLE_CLIENT_ID = "522451958550-vdom8v953dg7s0jone3el40uoa3v42q1.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> {/* 2. تغليف التطبيق */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);