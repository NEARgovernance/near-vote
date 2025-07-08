import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useContractManager } from "../hooks/useContractManager.js";
import { near } from "../hooks/fastnear.js";
import { Proposal } from "../Voting/Proposal.jsx";
import { Constants } from "../hooks/constants.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";

export function ProposalDetailPage({ contractId }) {
  const params = useParams();
  const location = useLocation();
  const contractManager = useContractManager();

  const [proposal, setProposal] = useState(null);
  const [votingConfig, setVotingConfig] = useState(null);
  const [resolvedContractId, setResolvedContractId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const segments = location.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const parsedProposalId = parseInt(lastSegment, 10);

  if (isNaN(parsedProposalId) || parsedProposalId < 0) {
    return <Navigate to="/" replace />;
  }

  const isMainVotingContract =
    segments[0] === "proposal" && segments.length === 2;

  const backPath =
    segments.length > 1 ? "/" + segments.slice(0, -1).join("/") : "/";
  const exitPath = isMainVotingContract ? "/" : backPath;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const contractSegments = segments.slice(0, -1);
        let contractIdToUse = null;

        if (isMainVotingContract) {
          contractIdToUse = contractId || Constants.VOTING_CONTRACT_ID;
        } else if (contractSegments.length > 0) {
          contractIdToUse = contractSegments.reverse().join(".");
          if (!/\.(near|testnet)$/.test(contractIdToUse)) {
            contractIdToUse +=
              Constants.NETWORK_ID === "mainnet" ? ".near" : ".testnet";
          }
        }

        console.log("resolvedContractId:", contractIdToUse);
        setResolvedContractId(contractIdToUse);

        const contract = await contractManager.switchContractByPath(
          contractIdToUse
            .replace(/\.?(near|testnet)$/, "")
            .split(".")
            .reverse()
        );

        const [proposalData, config] = await Promise.all([
          near.view({
            contractId: contract.contractId,
            methodName: "get_proposal",
            args: { proposal_id: parsedProposalId },
          }),
          near.view({
            contractId: contract.contractId,
            methodName: "get_config",
            args: {},
          }),
        ]);

        if (!proposalData) {
          setError("Proposal not found");
        } else {
          setProposal({ ...proposalData, id: parsedProposalId });
          setVotingConfig(config);
        }
      } catch (err) {
        console.error("Failed to fetch proposal:", {
          err,
          resolvedContractId: contractIdToUse,
          parsedProposalId,
        });
        setError("Proposal not found or contract unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.pathname, contractManager, contractId]);

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
        <h4 className="alert-heading">Proposal {parsedProposalId} Not Found</h4>
        <hr />
        <Link to="/" className="btn btn-primary">
          ← exit
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <Breadcrumbs />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{proposal.title}</h2>
      </div>
      <Proposal
        proposal={proposal}
        votingConfig={votingConfig}
        votingContractId={resolvedContractId}
      />
    </div>
  );
}
