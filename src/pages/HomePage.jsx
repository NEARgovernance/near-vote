import { Link } from "react-router-dom";
import { useState } from "react";
import { useNonce } from "../hooks/useNonce.js";
import { Constants } from "../hooks/constants.js";
import { useNearView } from "../hooks/useNearView.js";
import { toNear } from "../hooks/utils.js";
import React from "react";

const PROPOSALS_PER_PAGE = 10;
const CHUNK_SIZE = 100;

function ProposalCard({ proposal, compact = false }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      Created: { class: "bg-warning text-dark", text: "Pending" },
      Rejected: { class: "bg-danger", text: "Rejected" },
      Approved: { class: "bg-primary", text: "Approved" },
      Voting: { class: "bg-success", text: "Active" },
      Finished: { class: "bg-dark", text: "Finished" },
    };

    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  return (
    <div className={`card ${compact ? "mb-2" : "mb-3"}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className={`card-title ${compact ? "mb-1" : "mb-2"}`}>
              <Link
                to={`/proposal/${proposal.id}`}
                className="text-decoration-none fw-bold"
              >
                #{proposal.id}: {proposal.title}
              </Link>
              <span className="ms-2">{getStatusBadge(proposal.status)}</span>
            </h6>
            <div className="text-muted small mb-2">
              by <code>{proposal.proposer_id}</code>
            </div>
            {!compact && proposal.description && (
              <p className="card-text small text-secondary">
                {proposal.description.length > 120
                  ? `${proposal.description.substring(0, 120)}...`
                  : proposal.description}
              </p>
            )}
          </div>
          <Link
            to={`/proposal/${proposal.id}`}
            className="btn btn-sm btn-outline-primary ms-2"
          >
            {proposal.status === "Voting" ? "Vote" : "View"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HomePage({ accountId, onCreateProposal }) {
  const nonce = useNonce();
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const votingConfig = useNearView({
    initialValue: null,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_config",
    args: {},
    extraDeps: [nonce],
    errorValue: "err",
  });

  const numProposals = useNearView({
    initialValue: null,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_num_proposals",
    args: {},
    extraDeps: [nonce],
    errorValue: 0,
  });

  const pagesPerChunk = CHUNK_SIZE / PROPOSALS_PER_PAGE;
  const currentChunk = Math.floor((currentPage - 1) / pagesPerChunk);
  const chunkStartIndex = Math.max(
    0,
    (numProposals || 0) - (currentChunk + 1) * CHUNK_SIZE
  );

  const currentChunkData = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => !!extraDeps[1],
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_proposals",
    args: {
      from_index: chunkStartIndex,
      limit: CHUNK_SIZE,
    },
    extraDeps: [nonce, numProposals, currentChunk],
    errorValue: null,
  });

  const shouldPrefetchNext =
    currentPage >= currentChunk * pagesPerChunk + (pagesPerChunk - 2);
  const nextChunkStartIndex = Math.max(
    0,
    (numProposals || 0) - (currentChunk + 2) * CHUNK_SIZE
  );
  const hasNextChunk = (currentChunk + 1) * CHUNK_SIZE < (numProposals || 0);

  const nextChunkData = useNearView({
    initialValue: null,
    condition: () =>
      shouldPrefetchNext && hasNextChunk && (numProposals || 0) > CHUNK_SIZE,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_proposals",
    args: {
      from_index: nextChunkStartIndex,
      limit: CHUNK_SIZE,
    },
    extraDeps: [nonce, numProposals, currentChunk, shouldPrefetchNext],
    errorValue: null,
  });

  const numApprovedProposals = useNearView({
    initialValue: null,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_num_approved_proposals",
    args: {},
    extraDeps: [nonce],
    errorValue: 0,
  });

  const lastApprovedProposals = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => !!extraDeps[1],
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_approved_proposals",
    args: {
      from_index: Math.max(0, (numApprovedProposals || 0) - CHUNK_SIZE),
    },
    extraDeps: [nonce, numApprovedProposals],
    errorValue: null,
  });

  const allLoadedProposals = currentChunkData ? [...currentChunkData] : [];
  if (nextChunkData && shouldPrefetchNext) {
    allLoadedProposals.unshift(...nextChunkData);
  }

  const allProposals = allLoadedProposals.reverse() || [];

  const activeProposals =
    lastApprovedProposals?.filter((p) => p.status === "Voting") || [];

  const pendingProposals =
    allProposals?.filter(
      (p) => !lastApprovedProposals?.some((ap) => ap.id === p.id)
    ) || [];

  const finishedProposals =
    lastApprovedProposals?.filter((p) => p.status === "Finished") || [];

  const getFilteredProposals = () => {
    switch (statusFilter) {
      case "active":
        return activeProposals;
      case "pending":
        return pendingProposals;
      case "finished":
        return finishedProposals;
      default:
        return allProposals;
    }
  };

  const filteredProposals = getFilteredProposals();

  const totalPages = Math.ceil(filteredProposals.length / PROPOSALS_PER_PAGE);
  const startIndex = (currentPage - 1) * PROPOSALS_PER_PAGE;
  const endIndex = startIndex + PROPOSALS_PER_PAGE;
  const paginatedProposals = filteredProposals.slice(startIndex, endIndex);

  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <div className="text-center py-5 mb-2">
        <h1 className="display-5 mb-2">House of Stake</h1>
        <p className="lead">Participate in NEAR Governance (on Testnet)</p>

        {!accountId ? (
          <div
            className="alert alert-warning mb-0 mt-4 d-flex flex-column justify-content-center text-center"
            role="alert"
          >
            <h5 className="alert-heading mb-2">Welcome!</h5>
            <p className="mb-1">Please sign in to access all features.</p>
          </div>
        ) : (
          <div
            className="alert alert-warning mb-0 mt-4 d-flex flex-column justify-content-center text-center"
            role="alert"
          >
            <h5 className="alert-heading mb-2">Make yourself at home!</h5>
            <p className="mb-1">
              👤 signed in as <code>{accountId}</code>
            </p>
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 w-100 w-sm-auto mb-3">
            <h3 className="mb-0 ms-1 me-1">Proposals</h3>
            <div
              className="btn-group"
              role="group"
              aria-label="Filter proposals"
            >
              <input
                type="radio"
                className="btn-check"
                name="statusFilter"
                id="filter-all"
                checked={statusFilter === "all"}
                onChange={() => handleFilterChange("all")}
              />
              <label
                className="btn btn-outline-dark btn-sm"
                htmlFor="filter-all"
              >
                Recent
              </label>

              <input
                type="radio"
                className="btn-check"
                name="statusFilter"
                id="filter-active"
                checked={statusFilter === "active"}
                onChange={() => handleFilterChange("active")}
              />
              <label
                className="btn btn-outline-dark btn-sm"
                htmlFor="filter-active"
              >
                Active
              </label>

              <input
                type="radio"
                className="btn-check"
                name="statusFilter"
                id="filter-pending"
                checked={statusFilter === "pending"}
                onChange={() => handleFilterChange("pending")}
              />
              <label
                className="btn btn-outline-dark btn-sm"
                htmlFor="filter-pending"
              >
                Pending
              </label>

              <input
                type="radio"
                className="btn-check"
                name="statusFilter"
                id="filter-finished"
                checked={statusFilter === "finished"}
                onChange={() => handleFilterChange("finished")}
              />
              <label
                className="btn btn-outline-dark btn-sm"
                htmlFor="filter-finished"
              >
                Finished
              </label>
            </div>

            {accountId && (
              <button
                className="btn btn-outline-success btn-sm"
                onClick={onCreateProposal}
              >
                Create Proposal
              </button>
            )}
          </div>

          {filteredProposals.length > 0 ? (
            <>
              <div className="mb-4">
                {paginatedProposals.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    compact={false}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <nav aria-label="Proposals pagination" className="mb-3">
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
            </>
          ) : (
            <div className="text-center py-5">
              <div className="text-muted">
                <h5>
                  No {statusFilter === "all" ? "" : statusFilter} proposals
                </h5>
                <p>
                  {statusFilter === "active" &&
                    "No proposals are currently accepting votes."}
                  {statusFilter === "pending" &&
                    "No proposals are awaiting review."}
                  {statusFilter === "finished" &&
                    "No proposals have been completed yet."}
                  {statusFilter === "all" &&
                    "No proposals have been created yet."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="col-lg-4">
          {/* <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Voting Contracts</h5>
            </div>
            <div className="card-body">
                <div className="d-grid gap-2 mb-2">
                  <button className="btn btn-outline-primary btn-sm">
                    Browse
                  </button>
                  <button className="btn btn-primary btn-sm">
                    Deploy
                  </button>
                </div>
              </div>
          </div> */}

          <h3 className="mb-3 ms-1 me-1">Details</h3>
          <div className="card">
            <div className="card-body">
              <div className="mb-2">
                <strong>Voting Contract:</strong>
                <br />
                <small>
                  <code>{Constants.VOTING_CONTRACT_ID}</code>
                </small>
              </div>
              <div className="mb-2">
                <strong>Stats:</strong>{" "}
                <span className="badge bg-primary m-1">
                  {numProposals || 0} total
                </span>
                <span className="badge bg-success m-1">
                  {activeProposals.length} active
                </span>
                <span className="badge bg-dark m-1">
                  {finishedProposals.length} finished
                </span>
              </div>
              {votingConfig && votingConfig !== "err" && (
                <>
                  <hr className="my-2" />
                  <div className="mb-2">
                    <strong>veNEAR Contract:</strong>
                    <br />
                    <small>
                      <code>{votingConfig.venear_account_id}</code>
                    </small>
                  </div>
                  <div className="mb-2">
                    <strong>Voting Duration:</strong>{" "}
                    <code>
                      {Math.round(
                        parseFloat(votingConfig.voting_duration_ns) /
                          (1e9 * 86400)
                      )}{" "}
                      days
                    </code>
                  </div>
                  <div className="mb-2">
                    <strong>Max Voting Options:</strong>{" "}
                    <code>{votingConfig.max_number_of_voting_options}</code>
                  </div>
                  <div className="mb-2">
                    <strong>Base Proposal Fee:</strong>{" "}
                    <code>{toNear(votingConfig.base_proposal_fee)}</code>
                  </div>
                  <div className="mb-2">
                    <strong>Vote Storage Fee:</strong>{" "}
                    <code>{toNear(votingConfig.vote_storage_fee)}</code>
                  </div>
                  <div className="mb-2">
                    <strong>Owner:</strong>
                    <br />
                    <small>
                      <code>{votingConfig.owner_account_id}</code>
                    </small>
                  </div>
                  {votingConfig.reviewer_ids &&
                    votingConfig.reviewer_ids.length > 0 && (
                      <div className="mb-2">
                        <strong>Reviewers:</strong>
                        <br />
                        {votingConfig.reviewer_ids.map((reviewer, index) => (
                          <small key={index}>
                            <code>{reviewer}</code>
                            {index < votingConfig.reviewer_ids.length - 1 && (
                              <br />
                            )}
                          </small>
                        ))}
                      </div>
                    )}
                  {votingConfig.guardians &&
                    votingConfig.guardians.length > 0 && (
                      <div className="mb-2">
                        <strong>Guardians:</strong>{" "}
                        <span className="badge bg-warning">
                          {votingConfig.guardians.length}
                        </span>
                      </div>
                    )}
                </>
              )}
              {votingConfig === "err" && (
                <div className="text-muted small">
                  <em>Unable to load contract config</em>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
