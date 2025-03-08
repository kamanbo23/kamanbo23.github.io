import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ActiveLink } from '../App';

const Navbar = () => {
  const { isAuthenticated, logout, isAdmin, isUser } = useAuth();

  return (
    <div className="navbar">
      <ActiveLink to="/events">Events</ActiveLink>
      <ActiveLink to="/opportunities">Opportunities</ActiveLink>
      {isAuthenticated ? (
        <>
          {isUser && <ActiveLink to="/profile">Profile</ActiveLink>}
          {isAdmin && <ActiveLink to="/admin">Admin Panel</ActiveLink>}
          <button onClick={logout} className="nav-link logout-btn">
            Logout
          </button>
        </>
      ) : (
        <>
          <ActiveLink to="/login">Login</ActiveLink>
          <ActiveLink to="/register">Register</ActiveLink>
        </>
      )}
    </div>
  );
};

export default Navbar; 