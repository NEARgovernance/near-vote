import { useParams, Link, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNearView } from "../hooks/useNearView.js";
import { useNonce } from "../hooks/useNonce.js";
import { Constants } from "../hooks/constants.js";
import { Proposal } from "../Voting/Proposal.jsx";

export function ProposalDetailPage() {
  const { proposalId } = useParams();
  const nonce = useNonce();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate proposalId
  const parsedProposalId = parseInt(proposalId, 10);
  if (isNaN(parsedProposalId) || parsedProposalId < 0) {
    return <Navigate to="/" replace />;
  }

  // Fetch voting config
  const votingConfig = useNearView({
    initialValue: null,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_config",
    args: {},
    extraDeps: [nonce],
    errorValue: "err",
  });

  // Fetch specific proposal
  const proposal = useNearView({
    initialValue: null,
    contractId: Constants.VOTING_CONTRACT_ID,
    methodName: "get_proposal",
    args: { proposal_id: parsedProposalId },
    extraDeps: [nonce],
    errorValue: null,
  });

  useEffect(() => {
    if (proposal !== null) {
      setLoading(false);
      if (!proposal) {
        setError("Proposal not found");
      }
    }
  }, [proposal]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Proposal Not Found</h4>
        <p>The proposal with ID {proposalId} could not be found.</p>
        <hr />
        <Link to="/" className="btn btn-primary">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5 mb-5">
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
            Proposal #{proposalId}
          </li>
        </ol>
      </nav>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{proposal.title}</h2>
        <div>
          <Link to="/" className="btn btn-outline-secondary">
            ← Back to All Proposals
          </Link>
        </div>
      </div>

      <Proposal proposal={proposal} votingConfig={votingConfig} />
    </div>
  );
}
