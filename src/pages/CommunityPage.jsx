import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNearView } from "../hooks/useNearView.js";
import { Constants } from "../hooks/constants.js";
import { useNonce } from "../hooks/useNonce.js";
import { processAccount, toVeNear } from "../hooks/utils.js";

function processAccounts(accounts) {
  return accounts
    .map((accountInfo) => processAccount(accountInfo.account))
    .sort((a, b) => b.totalBalance.cmp(a.totalBalance));
}

export function CommunityPage() {
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("totalBalance");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const nonce = useNonce();

  const totalSupply = useNearView({
    initialValue: null,
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "ft_total_supply",
    args: {},
    extraDeps: [nonce],
    errorValue: "0",
  });

  const numAccounts = useNearView({
    initialValue: null,
    contractId: Constants.VENEAR_CONTRACT_ID,
    methodName: "get_num_accounts",
    args: {},
    extraDeps: [nonce],
    errorValue: "err",
  });

  const [accounts, setAccounts] = useState(null);

  useEffect(() => {
    if (numAccounts === null || numAccounts === "err") {
      setAccounts(null);
      return;
    }
    const promises = [];
    for (let i = 0; i < numAccounts; i += Constants.NUM_ACCOUNTS_PER_QUERY) {
      promises.push(
        near.view({
          contractId: Constants.VENEAR_CONTRACT_ID,
          methodName: "get_accounts",
          args: { from_index: i, limit: Constants.NUM_ACCOUNTS_PER_QUERY },
        })
      );
    }
    Promise.all(promises)
      .then((results) => {
        setAccounts(processAccounts(results.flat()));
      })
      .catch(() => {
        setAccounts(null);
      });
  }, [numAccounts, nonce]);

  // Calculate delegator counts for each account
  const accountsWithDelegatorCounts = accounts
    ? accounts.map((account) => {
        const delegatorCount = accounts.filter(
          (acc) =>
            acc.delegation && acc.delegation.account_id === account.accountId
        ).length;

        return {
          ...account,
          delegatorCount,
        };
      })
    : null;

  // Sort accounts based on current sort criteria
  const sortedAccounts = accountsWithDelegatorCounts
    ? [...accountsWithDelegatorCounts].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case "totalBalance":
            comparison = a.totalBalance.cmp(b.totalBalance);
            break;
          case "delegatedBalance":
            comparison = a.delegatedBalance.cmp(b.delegatedBalance);
            break;
          case "delegatorCount":
            comparison = a.delegatorCount - b.delegatorCount;
            break;
          default:
            comparison = a.totalBalance.cmp(b.totalBalance);
        }

        return sortDirection === "asc" ? comparison : -comparison;
      })
    : null;

  // Pagination calculations
  const totalItems = sortedAccounts?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedAccounts = sortedAccounts?.slice(startIndex, endIndex) || null;

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortDirection]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="mt-5 mb-5">
      <div className="d-flex justify-content-between align-items-right mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link
                to="/"
                style={{
                  fontWeight: "bold",
                  color: "gray",
                  textDecoration: "none",
                }}
              >
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Community
            </li>
          </ol>
        </nav>
      </div>

      {/* Contract Overview */}
      <div className="row">
        <div className="col-md-4 mt-2 mb-2">
          <div className="card text-center">
            <div className="card-body">
              <h4 className="card-title">Supply</h4>
              <h3 className="card-text">
                <code>
                  ~
                  {Math.round(
                    parseFloat(toVeNear(totalSupply).replace(/[^\d.]/g, ""))
                  ) + " veNEAR"}
                </code>
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 mt-2 mb-2">
          <div className="card text-center">
            <div className="card-body">
              <h4 className="card-title">Participants</h4>
              <h3 className="card-text">
                <code>
                  {numAccounts !== null ? numAccounts.toLocaleString() : "..."}{" "}
                  Registered
                </code>
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-4 mt-2 mb-2">
          <div className="card text-center">
            <div className="card-body">
              <h4 className="card-title">Contract</h4>
              <h3 className="card-text">
                <code>{Constants.VENEAR_CONTRACT_ID}</code>
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {accounts && (
        <div className="row">
          <div className="col-md-3 mt-2 mb-2">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Representatives</h5>
                <h4 className="card-text">
                  <code>
                    {
                      accounts.filter((acc) =>
                        accounts.some(
                          (a) =>
                            a.delegation &&
                            a.delegation.account_id === acc.accountId
                        )
                      ).length
                    }
                  </code>
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-2 mb-2">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Constituents</h5>
                <h4 className="card-text">
                  <code>{accounts.filter((acc) => acc.delegation).length}</code>
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-2 mb-2">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Voters</h5>
                <h4 className="card-text">
                  <code>
                    {accounts.filter((acc) => !acc.delegation).length}
                  </code>
                </h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mt-2 mb-4">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Amount Delegated</h5>
                <h4 className="card-text">
                  <code>
                    {(() => {
                      let sum = null;

                      for (const acc of accounts) {
                        if (
                          acc.delegatedBalance &&
                          acc.delegatedBalance.toString() !== "0"
                        ) {
                          sum = sum
                            ? sum.add(acc.delegatedBalance)
                            : acc.delegatedBalance;
                        }
                      }

                      return sum ? toVeNear(sum) : "0 veNEAR";
                    })()}
                  </code>
                </h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ecosystem Leaderboard */}
      <div className="card mt-3">
        <div className="card-header">
          <div className="d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center justify-content-between mb-2">
            <h5 className="mb-0">Ecosystem Leaderboard</h5>
            <div className="d-flex align-items-center gap-2">
              <select
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <small className="text-muted">per page</small>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              Ranked by{" "}
              <strong>
                {sortBy === "totalBalance"
                  ? "veNEAR Balance"
                  : sortBy === "delegatedBalance"
                  ? "Delegated Balance"
                  : "Delegator Count"}
              </strong>{" "}
              ({sortDirection === "asc" ? "ascending" : "descending"})
            </small>
            <small className="text-muted">
              {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
              {totalItems.toLocaleString()} accounts
            </small>
          </div>
        </div>

        <div className="card-body">
          {displayedAccounts ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Account ID</th>
                    <th
                      scope="col"
                      className="sortable-header"
                      onClick={() => handleSort("totalBalance")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      veNEAR Balance {getSortIcon("totalBalance")}
                    </th>
                    <th
                      scope="col"
                      className="sortable-header"
                      onClick={() => handleSort("delegatedBalance")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Delegated Balance {getSortIcon("delegatedBalance")}
                    </th>
                    <th
                      scope="col"
                      className="sortable-header"
                      onClick={() => handleSort("delegatorCount")}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      Delegators {getSortIcon("delegatorCount")}
                    </th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAccounts.map((account, i) => (
                    <tr key={account.accountId}>
                      <th scope="row">{startIndex + i + 1}</th>
                      <td>
                        <a
                          href={`https://testnet.nearblocks.io/address/${account.accountId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          <code>{account.accountId}</code>
                        </a>
                      </td>
                      <td className="fw-bold">
                        {toVeNear(account.totalBalance)}
                      </td>
                      <td>{toVeNear(account.delegatedBalance)}</td>
                      <td>
                        <span className="badge bg-primary">
                          {account.delegatorCount}
                        </span>
                      </td>
                      <td>
                        {account.delegation ? (
                          <span className="badge bg-info">
                            Delegated to {account.delegation.account_id}
                          </span>
                        ) : account.delegatorCount > 0 ? (
                          <span className="badge bg-success">Delegate</span>
                        ) : (
                          <span className="badge bg-secondary">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading accounts...</span>
              </div>
              <p className="mt-2 text-muted">Loading account data...</p>
            </div>
          )}
        </div>

        {/* Consistent Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center">
            <nav aria-label="Accounts pagination" className="mb-3">
              <ul className="pagination pagination-sm">
                {currentPage > 1 && (
                  <li className="page-item">
                    <button
                      className="page-link prev-page"
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </button>
                  </li>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={`page-item ${
                        currentPage === page ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  )
                )}

                {currentPage < totalPages && (
                  <li className="page-item">
                    <button
                      className="page-link next-page"
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
