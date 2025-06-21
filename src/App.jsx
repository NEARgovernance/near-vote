import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import "./App.css";
import { Header } from "./Header/Header.jsx";
import { useAccount } from "./hooks/useAccount.js";
import { HomePage } from "./pages/HomePage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";
import { CommunityPage } from "./pages/CommunityPage.jsx";
import { ProposalDetailPage } from "./pages/ProposalDetailPage.jsx";
import { CreateProposalModal } from "./components/CreateProposalModal.jsx";

function App() {
  const accountId = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      <Header
        accountId={accountId}
        onCreateProposal={() => setShowCreateModal(true)}
      />
      <div className="container">
        <Routes>
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
          <Route
            path="/proposal/:proposalId"
            element={<ProposalDetailPage />}
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
