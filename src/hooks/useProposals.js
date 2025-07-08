import { useState, useEffect, useCallback } from "react";
import { useContractManager } from "./useContractManager.js";
import { decorateProposal } from "./utils.js";

export function useProposals(selectedContractIds = []) {
  const contractManager = useContractManager();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  console.log("Selected contract IDs:", selectedContractIds);

  const fetchProposalsFromContract = useCallback(async (contract) => {
    try {
      if (typeof near === "undefined") {
        return [
          decorateProposal(
            {
              id: Math.floor(Math.random() * 1000),
              title: `Sample Proposal from ${contract.contractName}`,
              description: `This is a sample proposal from ${contract.contractId}`,
              status: ["Created", "Voting", "Approved", "Rejected"][
                Math.floor(Math.random() * 4)
              ],
              proposer_id: "user.testnet",
              created_at: Date.now() - Math.random() * 86400000 * 7,
            },
            contract
          ),
        ];
      }

      const numProposals = await near.view({
        contractId: contract.contractId,
        methodName: "get_num_proposals",
        args: {},
      });
      console.log(
        "🔢 Proposal count for",
        contract.contractId,
        ":",
        numProposals
      );

      if (!numProposals || numProposals === 0) return [];

      const startIdx = Math.max(0, numProposals - 50);
      const proposalIds = Array.from(
        { length: numProposals - startIdx },
        (_, i) => startIdx + i
      );

      const results = await Promise.allSettled(
        proposalIds.map((id) =>
          near
            .view({
              contractId: contract.contractId,
              methodName: "get_proposal",
              args: { proposal_id: id },
            })
            .then((proposal) => decorateProposal({ ...proposal, id }, contract))
        )
      );

      return results
        .filter((res) => res.status === "fulfilled")
        .map((res) => res.value);
    } catch (error) {
      console.error(
        `Error fetching proposals from ${contract.contractId}:`,
        error
      );
      throw error;
    }
  }, []);

  const fetchAllProposals = useCallback(async () => {
    if (!contractManager || selectedContractIds.length === 0) {
      setProposals([]);
      return;
    }

    setLoading(true);
    setErrors({});

    console.log("== ContractManager snapshot ==");
    console.log("All contracts:", contractManager.getAllContracts());
    console.log("SelectedContractIds:", selectedContractIds);

    const contracts = selectedContractIds
      .map((id) => contractManager.getContractByAddress(id))
      .filter((c) => {
        const ok = c && c.contractId;
        if (!ok) console.warn("⚠️ Missing contract info for:", c);
        return ok;
      });

    console.log("Resolved contracts:", contracts); // ✅ Moved here

    const results = await Promise.allSettled(
      contracts.map(async (contract) => {
        const props = await fetchProposalsFromContract(contract);
        return { contractId: contract.contractId, proposals: props };
      })
    );

    const allProposals = [];
    const newErrors = {};

    for (const res of results) {
      if (res.status === "fulfilled") {
        allProposals.push(...res.value.proposals);
      } else if (res.reason && res.reason.contractId) {
        newErrors[res.reason.contractId] = res.reason.message;
      }
    }

    allProposals.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    setProposals(allProposals);
    setErrors(newErrors);
    setLoading(false);
  }, [contractManager, selectedContractIds, fetchProposalsFromContract]);

  useEffect(() => {
    fetchAllProposals();
  }, [fetchAllProposals]);

  return {
    proposals,
    loading,
    errors,
    refetch: fetchAllProposals,
  };
}
