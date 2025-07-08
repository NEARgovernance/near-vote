import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useContractManager } from "./useContractManager.js";
import { Constants } from "./constants.js";

export function useContractNavigation() {
  const contractManager = useContractManager();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    if (pathSegments.length === 0) return;

    const KNOWN_ROUTES = new Set([
      "",
      "proposal",
      "polls",
      "community",
      "account",
    ]);

    if (KNOWN_ROUTES.has(pathSegments[0])) return;

    const isFactoryRoot =
      pathSegments.length === 1 &&
      Constants.FACTORY_CONTRACTS.some((f) => f.id === pathSegments[0]);

    if (isFactoryRoot) {
      console.log(`Navigated to known factory: ${pathSegments[0]}`);
      return;
    }

    contractManager.switchContractByPath(pathSegments).catch((err) => {
      console.warn("Failed to switch contract from URL path:", err);
    });

    console.log("Current path:", location.pathname);
    console.log("Path segments:", pathSegments);
  }, [location.pathname, contractManager]);

  // Navigation utilities
  const navigateToContract = (contract) => {
    if (!contract) return;
    const path = contractManager.getContractPath(contract);
    navigate(path);
  };

  const navigateToProposal = (proposalId, contract = null) => {
    const targetContract = contract || contractManager.getCurrentContract();
    const contractPath = contractManager.getContractPath(targetContract);
    navigate(`${contractPath}/${proposalId}`);
  };

  const generateProposalUrl = (proposalId, contract = null) => {
    const targetContract = contract || contractManager.getCurrentContract();
    const contractPath = contractManager.getContractPath(targetContract);
    return `${contractPath}/${proposalId}`;
  };

  return {
    navigateToContract,
    navigateToProposal,
    generateProposalUrl,
  };
}
