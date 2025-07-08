import { useParams, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useContractManager } from "../hooks/useContractManager.js";
import { HomePage } from "./HomePage.jsx";

export function VotingPage({ accountId, onCreateProposal }) {
  const params = useParams();
  const contractManager = useContractManager();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contractManager) return;

    const switchContract = async () => {
      try {
        // Build path segments from params
        const pathSegments = [];

        if (params.contractId) {
          // Single segment route: /:contractId
          pathSegments.push(params.contractId);
        } else if (params.firstSegment && params.secondSegment) {
          // Two segment route: /:firstSegment/:secondSegment
          pathSegments.push(params.firstSegment, params.secondSegment);
        }

        if (pathSegments.length > 0) {
          await contractManager.switchContractByPath(pathSegments, false);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    switchContract();
  }, [
    contractManager,
    params.contractId,
    params.firstSegment,
    params.secondSegment,
  ]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading contract...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mt-5" role="alert">
        <h4 className="alert-heading">Contract Not Found</h4>
        <p>{error}</p>
        <hr />
        <a href="/" className="btn btn-primary">
          ← Home
        </a>
      </div>
    );
  }

  // Render the normal HomePage once contract is loaded
  return <HomePage accountId={accountId} onCreateProposal={onCreateProposal} />;
}
