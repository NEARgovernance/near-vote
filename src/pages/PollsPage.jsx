import { useState } from "react";
import { ContractSelector } from "../components/ContractSelector.jsx";
import { ProposalsView } from "../components/ProposalsView.jsx";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";

export function PollsPage() {
  const [selectedContractIds, setSelectedContractIds] = useState([]);

  return (
    <div className="container mb-5 mt-5">
      <Breadcrumbs />
      <div className="mb-4">
        <h2>Explore</h2>
        <p className="text-muted">
          Select voting contracts to view all their proposals in one place.
        </p>
      </div>

      <div className="mb-4">
        <ContractSelector
          selectedContractIds={selectedContractIds}
          onSelectionChange={setSelectedContractIds}
        />
      </div>

      <ProposalsView selectedContractIds={selectedContractIds} />
    </div>
  );
}
