import { Link, useLocation, useNavigate } from "react-router-dom";

export function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const segments = location.pathname.split("/").filter(Boolean);
  const paths = segments.map(
    (_, i) => "/" + segments.slice(0, i + 1).join("/")
  );

  const isDefaultProposalPath =
    segments.length === 2 && segments[0] === "proposal";

  const linkStyle = {
    color: "gray",
    textDecoration: "none",
  };

  const exitPath = isDefaultProposalPath
    ? "/"
    : segments.length > 1
    ? "/" + segments.slice(0, -1).join("/")
    : "/";

  return (
    <div className="mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-right mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/" style={{ ...linkStyle, fontWeight: "bold" }}>
                Home
              </Link>
            </li>

            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const path = paths[index];

              if (isDefaultProposalPath && segment === "proposal") return null;

              const label =
                isDefaultProposalPath && isLast
                  ? `Proposal #${segment}`
                  : decodeURIComponent(segment);

              return (
                <li
                  key={path}
                  className={`breadcrumb-item ${isLast ? "active" : ""}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {isLast ? (
                    label
                  ) : (
                    <Link to={path} style={linkStyle}>
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <button
          className="btn btn-outline-secondary btn-sm exit-button"
          onClick={() => navigate(exitPath)}
        >
          ← More
        </button>
      </div>
    </div>
  );
}
