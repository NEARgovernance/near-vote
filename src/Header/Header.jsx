import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { AccountNavbar } from "../SignIn/AccountNavbar.jsx";

export function Header({ accountId, onCreateProposal }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom shadow-sm w-100">
      <div className="container-fluid px-4">
        {/* Brand */}
        <Link to="/" className="navbar-brand fw-bold text-secondary">
          🏡 GovNEAR
        </Link>

        {/* Menu Button (Mobile Only) */}
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? "open" : ""}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Navigation */}
        <div
          className={`navbar-nav ms-auto d-flex flex-row align-items-center nav-buttons ${
            mobileMenuOpen ? "mobile-open" : ""
          }`}
        >
          <a
            type="button"
            className={`btn btn-outline-dark btn-sm me-3 nav-button ${
              isActiveRoute("/community") ? "active" : ""
            }`}
            href="/community"
            onClick={closeMobileMenu}
          >
            Community
          </a>

          <a
            type="button"
            className={`btn btn-outline-dark btn-sm me-3 nav-button ${
              isActiveRoute("/account") ? "active" : ""
            }`}
            href="/account"
            onClick={closeMobileMenu}
          >
            Account
          </a>

          <a
            type="button"
            className={`btn btn-outline-dark btn-sm me-3 nav-button ${
              isActiveRoute("/polls") ? "active" : ""
            }`}
            href="/polls"
            onClick={closeMobileMenu}
          >
            Polls
          </a>

          <div onClick={closeMobileMenu}>
            <AccountNavbar />
          </div>
        </div>

        {/* Overlay to close menu when clicking outside */}
        {mobileMenuOpen && (
          <div
            className="mobile-menu-overlay"
            onClick={closeMobileMenu}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.3)",
              zIndex: 999,
            }}
          />
        )}
      </div>
    </header>
  );
}
