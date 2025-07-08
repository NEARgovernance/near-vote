import { useProposals } from "../hooks/useProposals.js";
import { getProposalPath } from "../hooks/utils.js";
import { Link } from "react-router-dom";

export function ProposalsView({ selectedContractIds }) {
  const { proposals, loading, errors, refetch } =
    useProposals(selectedContractIds);

  const contractCount = new Set(proposals.map((p) => p.contractId)).size;
  const proposalCount = proposals.length;

  return (
    <div className="mt-4">
      {loading && <div>Loading proposals...</div>}

      {!loading && proposals.length === 0 && (
        <div>No proposals found for selected contracts.</div>
      )}

      {!loading && proposals.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <small className="text-muted">
              Showing {proposalCount}{" "}
              {proposalCount === 1 ? "proposal" : "proposals"} from{" "}
              {contractCount} {contractCount === 1 ? "contract" : "contracts"}
            </small>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={refetch}
            >
              Refresh
            </button>
          </div>

          <ul className="list-group">
            {proposals.map((proposal) => {
              console.log("Rendering proposal", proposal);
              console.log("Computed path", getProposalPath(proposal));
              return (
                <li
                  className="list-group-item"
                  key={`${proposal.contractId}:${proposal.id}`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{proposal.title}</strong>
                      <br />
                      <small className="text-muted">
                        {proposal.status} ·{" "}
                        {new Date(proposal.created_at).toLocaleDateString()} ·{" "}
                        {proposal.contractId}
                      </small>
                    </div>
                    <Link
                      to={getProposalPath(proposal)}
                      className="btn btn-sm btn-outline-primary"
                    >
                      View
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="mt-3 alert alert-warning">
          <strong>Some contracts failed to load:</strong>
          <ul>
            {Object.entries(errors).map(([contractId, err]) => (
              <li key={contractId}>
                {contractId}: {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
