import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Constants } from "../hooks/constants.js";
import { near, getNetworkId } from "../hooks/fastnear.js";
import { Breadcrumbs } from "../components/Breadcrumbs.jsx";

export function FactoryPage({ factoryId }) {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const factory = Constants.FACTORY_CONTRACTS.find((f) => f.id === factoryId);
  const networkId = getNetworkId();

  useEffect(() => {
    async function fetchContracts() {
      if (!factory) {
        setError("Unknown factory");
        setLoading(false);
        return;
      }

      try {
        const result = await near.view({
          contractId: factory.address,
          methodName: factory.method_get_contracts,
          args: {
            from_index: 0,
            limit: 50,
          },
        });

        setContracts(result);
      } catch (err) {
        console.error("Failed to fetch contracts from factory:", err);
        setError("Failed to fetch contracts");
      } finally {
        setLoading(false);
      }
    }

    fetchContracts();
  }, [factory]);

  if (loading) return <div className="mt-5">Loading factory contracts...</div>;
  if (error) return <div className="alert alert-danger mt-5">{error}</div>;

  return (
    <div className="mt-5">
      <Breadcrumbs />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Voting Contracts</h3>
      </div>

      <div className="row">
        {contracts.map((contractId) => {
          if (!contractId) return null;

          const factoryName = factoryId.split(".")[0]; // e.g. 'ballotbox'
          const contractParts = contractId.split(".");
          const localContractName = contractParts[0]; // e.g. 'dao'

          const path = `/${factoryName}/${localContractName}`;

          return (
            <div key={contractId} className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">{localContractName}</h5>
                <p className="card-text">{contractId}</p>
                <Link to={path} className="btn btn-outline-primary">
                  View Contract
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
