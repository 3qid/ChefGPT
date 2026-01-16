import { Routes, Route, Navigate } from "react-router-dom";
import Chat from "./Chat.jsx";
import Login from "./Login.jsx";
import Signup from "./signup.jsx";

// مكون لحماية المسارات (Protected Route)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  
  // إذا لم يوجد توكن، يتم توجيهه لصفحة تسجيل الدخول
  if (!token) {
    return <Navigate to="/Login" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="app-container">
      <Routes>
        {/* التوجيه التلقائي */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        
        {/* المسارات العامة */}
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        
        {/* المسار المحمي: لا يمكن دخوله إلا بتسجيل الدخول */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        
        {/* مسار للتعامل مع أي رابط خاطئ (اختياري) */}
        <Route path="*" element={<Navigate to="/Login" replace />} />
      </Routes>
    </div>
  );
}

export default App;