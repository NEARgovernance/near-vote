import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import { Header } from "./Header/Header.jsx";
import { useAccount } from "./hooks/useAccount.js";
import { useContractManager } from "./hooks/useContractManager.js";
import { useContractNavigation } from "./hooks/useContractNavigation.js";
import { HomePage } from "./pages/HomePage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";
import { CommunityPage } from "./pages/CommunityPage.jsx";
import { ProposalDetailPage } from "./pages/ProposalDetailPage.jsx";
import { CreateProposalModal } from "./components/CreateProposalModal.jsx";
import { PollsPage } from "./pages/PollsPage.jsx";
import { DynamicRoute } from "./components/DynamicRoute.jsx";
import { Constants } from "./hooks/constants.js";

const DEFAULT_CONTRACT_ID = Constants.VOTING_CONTRACT_ID || "vote.govai.near";

function App() {
  const accountId = useAccount();
  const contractManager = useContractManager();
  useContractNavigation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (contractManager) {
      window.contractManager = contractManager;
    }
  }, [contractManager]);

  return (
    <div>
      <Header
        accountId={accountId}
        onCreateProposal={() => setShowCreateModal(true)}
      />
      <div className="container">
        <Routes>
          {/* Static routes */}
          <Route
            path="/"
            element={
              <HomePage
                accountId={accountId}
                onCreateProposal={() => setShowCreateModal(true)}
              />
            }
          />
          <Route
            path="/account"
            element={<AccountPage accountId={accountId} />}
          />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/polls" element={<PollsPage />} />

          {/* Default contract proposal fallback */}
          <Route
            path="/proposal/:proposalId/"
            element={<ProposalDetailPage contractId={DEFAULT_CONTRACT_ID} />}
          />

          {/* Catch-all dynamic route for voting contracts */}
          <Route
            path="*"
            element={
              <DynamicRoute
                accountId={accountId}
                onCreateProposal={() => setShowCreateModal(true)}
              />
            }
          />
        </Routes>
      </div>

      <CreateProposalModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        accountId={accountId}
      />
    </div>
  );
}

export default App;
