import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Constants } from "../hooks/constants.js";
import { FactoryPage } from "../pages/FactoryPage.jsx";
import { ProposalsPage } from "../pages/ProposalsPage.jsx";
import { ProposalDetailPage } from "../pages/ProposalDetailPage.jsx";
import { useContractManager } from "../hooks/useContractManager.js";

export function DynamicRoute({ accountId, onCreateProposal }) {
  const location = useLocation();
  const contractManager = useContractManager();
  const [loading, setLoading] = useState(true);

  const segments = location.pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const isProposal = /^\d+$/.test(lastSegment);

  const knownFactoryIds = Constants.FACTORY_CONTRACTS.map((f) => f.id);
  let factoryId = null;
  let contractName = null;

  for (let i = 1; i <= segments.length - (isProposal ? 2 : 1); i++) {
    const candidate = segments.slice(0, i).join(".");
    if (knownFactoryIds.includes(candidate)) {
      factoryId = candidate;
      contractName = segments[i];
      break;
    }
  }

  if (isProposal && (!factoryId || !contractName)) {
    return <div className="mt-5">INVALID PATH</div>;
  }

  const contractId =
    contractName && factoryId
      ? `${contractName}.${factoryId}`
      : Constants.VOTING_CONTRACT_ID;

  const isFactoryPage =
    segments.length === 1 && knownFactoryIds.includes(segments[0]);

  useEffect(() => {
    if (!contractManager) return;

    if (!isFactoryPage) {
      contractManager.switchContractByPath(segments).then(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [segments.join("/"), contractManager]);

  if (loading) return <div className="mt-5">Loading contract data...</div>;

  if (isFactoryPage) {
    return <FactoryPage factoryId={segments[0]} />;
  }

  if (isProposal) {
    return (
      <ProposalDetailPage contractId={contractId} proposalId={lastSegment} />
    );
  }

  return (
    <ProposalsPage
      accountId={accountId}
      contractId={contractId}
      onCreateProposal={() => onCreateProposal(contractId)}
    />
  );
}
