import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google'; // أضفنا هذا السطر
import { jwtDecode } from "jwt-decode"; // أضفنا هذا السطر لفك تشفير بيانات جوجل
import './css/Login.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 1. دالة التسجيل العادي (كما هي)
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = { name, email, password };
      const response = await axios.post('http://localhost:5000/api/signup', userData);

      if (response.status === 201) {
        alert("Account Created Successfully!");
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong during signup");
    } finally {
      setLoading(false);
    }
  };

  // 2. دالة معالجة نجاح تسجيل الدخول بجوجل
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const details = jwtDecode(credentialResponse.credential);
      
      const response = await axios.post('http://localhost:5000/api/google-auth', {
        name: details.name,
        email: details.email,
        googleId: details.sub
      });

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        navigate('/chat');
      }
    } catch (err) {
      setError("Google Signup failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <form className="form" onSubmit={handleSignup}>
        <h1 className="title">Create Account</h1>

        {error && <p style={{ color: 'red', textAlign: 'center', fontSize: '14px' }}>{error}</p>}

        {/* حقل الاسم */}
        <div className="flex-column">
          <label>Full Name</label>
        </div>
        <div className="inputForm">
          <input 
            type="text" 
            className="input" 
            placeholder="Enter your name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
        </div>

        {/* حقل الإيميل */}
        <div className="flex-column">
          <label>Email</label>
        </div>
        <div className="inputForm">
          <input 
            type="email" 
            className="input" 
            placeholder="Enter your Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        {/* حقل الباسورد */}
        <div className="flex-column">
          <label>Password</label>
        </div>
        <div className="inputForm">
          <input 
            type="password" 
            className="input" 
            placeholder="Create a Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </div>

        <button type="submit" className="button-submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <p className="p">
          Already have an account? <Link to="/login" className="span">Sign In</Link>
        </p>

        <p className="p line">Or With</p>

        <div className="flex-row">
          {/* تعديل زر جوجل ليصبح برمجياً مع الحفاظ على التنسيق */}
          <div className="google-btn-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login Failed")}
              theme="outline"
              shape="pill"
              text="signup_with"
              width="250px"
            />
          </div>

          <button type="button" className="btn apple">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="apple" width="20" style={{marginRight: '8px'}} />
            Apple
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;