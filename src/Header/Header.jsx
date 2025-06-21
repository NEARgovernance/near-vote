import { Link, useLocation } from "react-router-dom";
import { AccountNavbar } from "../SignIn/AccountNavbar.jsx";

export function Header({ accountId, onCreateProposal }) {
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="navbar navbar-expand-lg navbar-light bg-white sticky-top border-bottom shadow-sm w-100">
      <div className="container-fluid px-4">
        {/* Brand */}
        <Link to="/" className="navbar-brand fw-bold text-secondary">
          🏠 HoS
        </Link>

        {/* Navigation */}
        <div className="navbar-nav ms-auto d-flex flex-row align-items-center">
          <a
            type="button"
            className={`btn btn-outline-dark btn-sm me-3 ${
              isActiveRoute("/community") ? "active" : ""
            }`}
            href="/community"
          >
            Community
          </a>

          <a
            type="button"
            className={`btn btn-outline-dark btn-sm me-3 ${
              isActiveRoute("/account") ? "active" : ""
            }`}
            href="/account"
          >
            Account
          </a>

          <AccountNavbar />
        </div>
      </div>
    </header>
  );
}
