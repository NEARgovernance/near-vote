import { useState } from "react";
import { Link } from "react-router-dom";
import { useNonce } from "../hooks/useNonce.js";
import { Constants } from "../hooks/constants.js";
import { useNearView } from "../hooks/useNearView.js";
import { Proposal } from "./Proposal.jsx";
import React from "react";

const MAX_NUM_PROPOSALS = 10;

function ProposalCard({ proposal, showInlinePreview = false }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      Created: { class: "bg-secondary", text: "Pending" },
      Rejected: { class: "bg-danger", text: "Rejected" },
      Approved: { class: "bg-info", text: "Approved" },
      Voting: { class: "bg-warning text-dark", text: "Active" },
      Finished: { class: "bg-success", text: "Finished" },
    };

    const config = statusConfig[status] || {
      class: "bg-secondary",
      text: status,
    };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  return (
    <div className="card mb-2">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="card-title mb-1">
              <Link
                to={`/proposal/${proposal.id}`}
                className="text-decoration-none fw-bold"
              >
                #{proposal.id}: {proposal.title}
              </Link>
              <span className="ms-2">{getStatusBadge(proposal.status)}</span>
            </h6>
            <p className="card-text text-muted small mb-2">
              by <code>{proposal.proposer_id}</code>
            </p>
            {proposal.description && (
              <p className="card-text small text-secondary">
                {proposal.description.length > 120
                  ? `${proposal.description.substring(0, 120)}...`
                  : proposal.description}
              </p>
            )}
          </div>
          <div className="ms-3">
            <Link
              to={`/proposal/${proposal.id}`}
              className="btn btn-sm btn-outline-primary"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VotingState(props) {
  const [loading, setLoading] = useState(false);
  const nonce = useNonce();
  const [showProposal, setShowProposal] = useState(null);
  const [activeProposalId, setActiveProposalId] = useState(null);

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
    errorValue: "err",
  });

  const lastProposals = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => !!extraDeps[1],
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_proposals",
    args: {
      from_index: Math.max(0, (numProposals || 0) - MAX_NUM_PROPOSALS),
    },
    extraDeps: [nonce, numProposals],
    errorValue: null,
  });

  const numApprovedProposals = useNearView({
    initialValue: null,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_num_approved_proposals",
    args: {},
    extraDeps: [nonce],
    errorValue: "err",
  });

  const lastApprovedProposals = useNearView({
    initialValue: null,
    condition: ({ extraDeps }) => !!extraDeps[1],
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_approved_proposals",
    args: {
      from_index: Math.max(0, (numApprovedProposals || 0) - MAX_NUM_PROPOSALS),
    },
    extraDeps: [nonce, numApprovedProposals],
    errorValue: null,
  });

  // Separate proposals by status
  const pendingProposals =
    lastProposals?.filter(
      (p) => !lastApprovedProposals?.some((ap) => ap.id === p.id)
    ) || [];

  const activeProposals =
    lastApprovedProposals?.filter((p) => p.status === "Voting") || [];

  const finishedProposals =
    lastApprovedProposals?.filter((p) => p.status === "Finished") || [];

  return (
    <div className="mb-5">
      <h3 id="voting">Voting System</h3>
      <div className="mb-4">
        <div className="row">
          <div className="col-md-6">
            <strong>Contract:</strong>{" "}
            <code>{Constants.VOTING_CONTRACT_ID}</code>
          </div>
          <div className="col-md-6">
            <strong>Total Proposals:</strong>{" "}
            <code>{numProposals === null ? "..." : numProposals}</code>
          </div>
        </div>
      </div>

      {/* Active Voting Proposals */}
      {activeProposals.length > 0 && (
        <div className="mb-4">
          <h5 className="text-success">
            <span className="badge bg-success me-2">
              {activeProposals.length}
            </span>
            Active Voting 🗳️
          </h5>
          {activeProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {/* Pending Proposals */}
      {pendingProposals.length > 0 && (
        <div className="mb-4">
          <h5 className="text-warning">
            <span className="badge bg-warning text-dark me-2">
              {pendingProposals.length}
            </span>
            Pending Review ⏳
          </h5>
          {pendingProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {/* Finished Proposals */}
      {finishedProposals.length > 0 && (
        <div className="mb-4">
          <h5 className="text-muted">
            <span className="badge bg-secondary me-2">
              {finishedProposals.length}
            </span>
            Finished ✅
          </h5>
          {finishedProposals
            .slice(-3)
            .reverse()
            .map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          {finishedProposals.length > 3 && (
            <div className="text-center mt-2">
              <small className="text-muted">
                Showing last 3 finished proposals
              </small>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!activeProposals.length &&
        !pendingProposals.length &&
        !finishedProposals.length && (
          <div className="text-center py-5">
            <div className="text-muted">
              <h5>None Found</h5>
              <a href="#create-proposal" className="btn btn-outline-primary">
                Create Proposal
              </a>
            </div>
          </div>
        )}

      {/* Legacy inline proposal view for backward compatibility */}
      {showProposal !== null && lastProposals && (
        <div className="mt-4 p-3 border rounded bg-light">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6>Quick Preview</h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowProposal(null)}
            >
              Close
            </button>
          </div>
          <Proposal
            proposal={lastProposals.find((p) => p.id === showProposal)}
            votingConfig={votingConfig}
          />
          <div className="mt-2">
            <Link
              to={`/proposal/${showProposal}`}
              className="btn btn-primary btn-sm"
            >
              Details
            </Link>
          </div>
        </div>
      )}

      {activeProposalId !== null && lastApprovedProposals && (
        <div className="mt-4 p-3 border rounded bg-light">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6>Quick Preview</h6>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setActiveProposalId(null)}
            >
              Close
            </button>
          </div>
          <Proposal
            proposal={lastApprovedProposals.find(
              (p) => p.id === activeProposalId
            )}
            votingConfig={votingConfig}
          />
          <div className="mt-2">
            <Link
              to={`/proposal/${activeProposalId}`}
              className="btn btn-primary btn-sm"
            >
              Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
