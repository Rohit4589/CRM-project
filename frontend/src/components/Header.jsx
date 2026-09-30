import React from 'react';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-user-info">
        <div className="user-details">
          <div className="user-welcome">Welcome, Bryan Maxim</div>
          <div className="user-actions">
            <a href="#"><i className="fa-solid fa-user"></i> Account Settings</a>
            <a href="#"><i className="fa-solid fa-arrow-right-from-bracket"></i> Logout</a>
          </div>
        </div>
        <img src="https://i.pravatar.cc/150?img=11" alt="Bryan Maxim" className="profile-pic" />
      </div>
    </header>
  );
};

export default Header;
