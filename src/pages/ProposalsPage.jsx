import { useContractManager } from "../hooks/useContractManager.js";
import { useAccount } from "../hooks/useAccount.js";
import { useEffect, useState } from "react";
import { near } from "../hooks/fastnear.js";
import { ProposalCard } from "../components/ProposalCard.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";
import { useNavigate } from "react-router-dom";

export function ProposalsPage({ contractId, onCreateProposal }) {
  const navigate = useNavigate();
  const accountId = useAccount();
  const contractManager = useContractManager();
  const [proposals, setProposals] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentContractId, setCurrentContractId] = useState(null);

  useEffect(() => {
    const contract = contractManager.getCurrentContract();
    if (contract?.contractId && contract.contractId !== currentContractId) {
      setCurrentContractId(contract.contractId);
    }
  }, [contractManager, contractManager.getCurrentContract()?.contractId]);

  useEffect(() => {
    if (!currentContractId) return;

    let canceled = false;
    setLoading(true);

    async function fetchData() {
      try {
        const [configResult, proposalsResult] = await Promise.all([
          near.view({
            contractId: currentContractId,
            methodName: "get_config",
            args: {},
          }),
          near.view({
            contractId: currentContractId,
            methodName: "get_proposals",
            args: { from_index: 0, limit: 100 },
          }),
        ]);

        if (canceled) return;

        console.log("Fetched config:", configResult);
        console.log("Fetched proposals:", proposalsResult);

        setConfig(configResult);

        const normalizedProposals = (proposalsResult || []).map(
          (proposal, idx) => ({
            ...proposal,
            id: idx,
            contractId: currentContractId,
          })
        );

        setProposals(normalizedProposals);
      } catch (err) {
        if (!canceled) {
          console.error("Failed to load contract page:", err);
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      canceled = true;
    };
  }, [currentContractId]);

  if (loading) return <div className="mt-5">Loading contract data...</div>;

  return (
    <div className="container mt-5">
      <Breadcrumbs />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3>Proposals</h3>
        </div>
        <div>
          <button
            className="btn btn-success btn-sm"
            onClick={() => onCreateProposal(currentContractId)}
          >
            + Create
          </button>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div>
          <p>
            <b>No proposals found.</b>
          </p>
          <p>
            Contract ID: <i>{currentContractId}</i>
          </p>
        </div>
      ) : (
        proposals.map((proposal) => (
          <ProposalCard key={proposal.id} proposal={proposal} config={config} />
        ))
      )}
    </div>
  );
}
