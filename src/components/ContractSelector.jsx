import { useState } from "react";
import { useContractManager } from "../hooks/useContractManager.js";
import { Constants } from "../hooks/constants.js";

export function ContractSelector({ selectedContractIds, onSelectionChange }) {
  const contractManager = useContractManager();
  const allContracts = contractManager.getAllContracts();
  const [manualInput, setManualInput] = useState("");
  const [loadingFactory, setLoadingFactory] = useState(null);

  const toggleContract = (contractId) => {
    if (selectedContractIds.includes(contractId)) {
      onSelectionChange(selectedContractIds.filter((id) => id !== contractId));
    } else {
      onSelectionChange([...selectedContractIds, contractId]);
    }
  };

  const handleAddContract = async () => {
    const input = manualInput.trim().toLowerCase();
    if (!input) return;

    const nearAccountRegex = /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/;
    if (!nearAccountRegex.test(input)) {
      alert("Invalid NEAR account name.");
      return;
    }

    const isFullAddress = input.endsWith(".testnet") || input.endsWith(".near");

    let contractId, contractName, factoryName;

    if (isFullAddress) {
      contractId = input;
      contractName = input.split(".")[0];
    } else {
      const [factoryInput, nameInput] = input.includes("/")
        ? input.split("/")
        : [null, input];
      factoryName = factoryInput;
      contractName = nameInput;
      contractId = contractManager.buildAddress(factoryName, contractName);
    }

    try {
      const result = await near.view({
        contractId,
        methodName: "get_num_proposals",
        args: {},
      });

      if (typeof result !== "number") {
        throw new Error("METHOD_NOT_FOUND: get_num_proposals");
      }

      const contract = {
        contractId,
        contractName,
        factoryName,
        type: factoryName ? "factory-deployed" : "custom",
      };

      contractManager.addContract(contract);
      onSelectionChange([...selectedContractIds, contractId]);
      setManualInput("");
    } catch (err) {
      console.warn("Failed to add contract...", err);

      let msg = "UNKNOWN ERROR";
      if (
        err?.cause?.info?.requested_account_id &&
        err?.cause?.name === "UNKNOWN_ACCOUNT"
      ) {
        msg = `NOT FOUND: ${err.cause.info.requested_account_id}`;
      } else if (err?.message) {
        msg = err.message;
      }

      alert(`INVALID CONTRACT\n\n${msg}`);
    }
  };

  return (
    <div className="mb-3">
      <h6>Select Contracts</h6>

      <div className="mb-3">
        {allContracts.map((contract) => (
          <div key={contract.contractId} className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id={contract.contractId}
              onChange={() => toggleContract(contract.contractId)}
              checked={selectedContractIds.includes(contract.contractId)}
            />
            <label className="form-check-label" htmlFor={contract.contractId}>
              {contract.contractId}
            </label>
          </div>
        ))}
      </div>

      {/* Factory Discovery Section */}
      <div className="m-2">
        <div className="d-flex flex-wrap gap-2">
          {Constants.FACTORY_CONTRACTS.map((factory) => {
            const factoryContracts = allContracts.filter(
              (c) => c.factoryName === factory.id
            );
            const isFactoryActive = factoryContracts.length > 0;

            return (
              <button
                key={factory.id}
                className={`btn btn-sm ${
                  isFactoryActive ? "btn-outline-danger" : "btn-outline-primary"
                }`}
                disabled={loadingFactory === factory.id}
                onClick={async () => {
                  if (isFactoryActive) {
                    factoryContracts.forEach((c) =>
                      contractManager.removeContract(c.contractId)
                    );
                    onSelectionChange(
                      selectedContractIds.filter(
                        (id) =>
                          !factoryContracts.some((c) => c.contractId === id)
                      )
                    );
                  } else {
                    setLoadingFactory(factory.id);
                    try {
                      await contractManager.discoverFactoryContracts(
                        factory.id
                      );
                      const newContracts = contractManager
                        .getAllContracts()
                        .filter((c) => c.factoryName === factory.id)
                        .map((c) => c.contractId);
                    } catch (err) {
                      alert(
                        `Error discovering contracts from ${factory.id}: ${err.message}`
                      );
                    } finally {
                      setLoadingFactory(null);
                    }
                  }
                }}
              >
                {loadingFactory === factory.id
                  ? `Loading ${factory.id}...`
                  : isFactoryActive
                  ? `- ${factory.id}`
                  : `+ ${factory.id}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Add Section */}
      <div className="mt-3">
        <h6>Input Voting Contract ID</h6>
        <input
          type="text"
          className="form-control form-control-sm m-2 mt-3"
          placeholder="example.metavote.near"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
        />
        <button
          className="btn btn-sm btn-outline-success m-2"
          onClick={handleAddContract}
        >
          Add Your Own
        </button>
      </div>
    </div>
  );
}
