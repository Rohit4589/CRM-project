import React from 'react';
import '../styles/Header.css';

const Header = ({ onLogout }) => {
  return (
    <header className="header">
      <div className="header-user-info">
        <div className="user-details">
          <div className="user-welcome">Welcome, Bryan Maxim</div>
          <div className="user-actions">
            <select style={{background: 'transparent', border: 'none', color: 'white', marginRight: '15px', outline: 'none', cursor: 'pointer', fontSize: '12px'}}>
              <option style={{color: '#333'}} value="en">English</option>
              <option style={{color: '#333'}} value="mr">Marathi (मराठी)</option>
              <option style={{color: '#333'}} value="hi">Hindi (हिंदी)</option>
            </select>
            <a href="#"><i className="fa-solid fa-user"></i> Account Settings</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}><i className="fa-solid fa-arrow-right-from-bracket"></i> Logout</a>
          </div>
        </div>
        <img src="https://i.pravatar.cc/150?img=11" alt="Bryan Maxim" className="profile-pic" />
      </div>
    </header>
  );
};

export default Header;
