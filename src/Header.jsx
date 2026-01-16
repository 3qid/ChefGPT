import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="top-header">
      <div className="logo">ChefGPT</div>
      <div className="auth-buttons">
        <Link to="/login" className="btn-login">Login</Link>
        <Link to="/signup" className="btn-signup">Sign up</Link>
      </div>
    </header>
  );
}

export default Header;
