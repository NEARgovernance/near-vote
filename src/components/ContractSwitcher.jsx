import { useState } from "react";
import { useContractManager } from "../hooks/useContractManager.js";

export function ContractSwitcher({ compact = false }) {
  const contractManager = useContractManager();
  const [loading, setLoading] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);

  const currentContract = contractManager?.getCurrentContract();
  const allContracts = contractManager?.getAllContracts() || [];

  const handleContractSwitch = async (contractId) => {
    if (!contractManager) return;
    setLoading(true);
    setError("");
    try {
      await contractManager.switchContract(contractId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomContract = async () => {
    if (!contractManager || !customAddress.trim()) return;

    setLoading(true);
    setError("");

    try {
      await contractManager.addCustomContract(
        customAddress.trim(),
        customName.trim() || undefined,
        "User-added custom contract"
      );

      setCustomAddress("");
      setCustomName("");
      setShowAddCustom(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverContracts = async () => {
    if (!contractManager) return;

    setIsDiscovering(true);
    setError("");

    try {
      const discovered = await contractManager.discoverFactoryContracts();
      if (discovered.length === 0) {
        setError("No factory contracts found");
      } else {
        setError(""); // Clear any previous error
      }
    } catch (err) {
      setError("Failed to discover contracts: " + err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  if (compact) {
    return (
      <div className="contract-switcher-compact">
        <div className="d-flex align-items-center gap-2">
          <small className="text-muted">Contract:</small>
          <select
            className="form-select form-select-sm"
            style={{ width: "auto", maxWidth: "200px" }}
            value={currentContract?.id || "official"}
            onChange={(e) => handleContractSwitch(e.target.value)}
            disabled={loading}
          >
            {allContracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.id}
              </option>
            ))}
          </select>
          {loading && (
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Switching...</span>
            </div>
          )}
        </div>
        {error && (
          <div className="alert alert-danger alert-sm mt-2 mb-0">
            <small>{error}</small>
          </div>
        )}
      </div>
    );
  }

  if (!contractManager) {
    return <div>Loading contract manager...</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Voting Contracts</h5>
      </div>
      <div className="card-body">
        {/* Current Contract Info */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <strong>Current:</strong> {currentContract?.name}
              <br />
              <small className="text-muted">{currentContract?.address}</small>
              <br />
              <span
                className={`badge badge-sm ${
                  currentContract?.type === "official"
                    ? "bg-primary"
                    : currentContract?.type === "factory-deployed"
                    ? "bg-info"
                    : "bg-secondary"
                }`}
              >
                {currentContract?.type.replace("-", " ")}
              </span>
            </div>
            {loading && (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && <div className="alert alert-danger alert-sm">{error}</div>}

        {/* Contract List */}
        <div className="mb-3">
          <strong>Available Contracts:</strong>

          {allContracts.map((contract) => (
            <ContractItem
              key={contract.id}
              contract={contract}
              isActive={currentContract?.id === contract.id}
              onSwitch={() => handleContractSwitch(contract.id)}
              canRemove={!contract.isBuiltIn}
              onRemove={() => contractManager.removeContract(contract.id)}
              disabled={loading}
            />
          ))}
        </div>

        {/* Discover Factory Contracts */}
        <div className="mb-3">
          <button
            className="btn btn-outline-info btn-sm w-100"
            onClick={handleDiscoverContracts}
            disabled={isDiscovering}
          >
            {isDiscovering
              ? "Discovering Contracts..."
              : "Discover Factory Contracts"}
          </button>
        </div>

        {/* Add Custom Contract */}
        <div>
          <button
            className="btn btn-outline-success btn-sm"
            onClick={() => setShowAddCustom(!showAddCustom)}
            disabled={loading}
          >
            {showAddCustom ? "Cancel" : "Add Custom Contract"}
          </button>

          {showAddCustom && (
            <div className="mt-2">
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Contract Address (e.g. vote.custom.testnet)"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Display Name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button
                className="btn btn-success btn-sm"
                onClick={handleAddCustomContract}
                disabled={loading || !customAddress.trim()}
              >
                Add Contract
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContractItem({
  contract,
  isActive,
  onSwitch,
  canRemove,
  onRemove,
  disabled,
}) {
  return (
    <div
      className={`p-2 border rounded mb-1 ${
        isActive ? "border-primary bg-light" : ""
      }`}
    >
      <div className="d-flex justify-content-between align-items-center">
        <div className="flex-grow-1">
          <div className="fw-bold small">{contract.id}</div>
          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
            {contract.address}
          </div>
          {contract.description && (
            <div className="text-muted" style={{ fontSize: "0.7rem" }}>
              {contract.description}
            </div>
          )}
        </div>

        <div className="d-flex gap-1">
          {!isActive && (
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={onSwitch}
              disabled={disabled}
            >
              Switch
            </button>
          )}
          {canRemove && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={onRemove}
              disabled={disabled}
              title="Remove contract"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
