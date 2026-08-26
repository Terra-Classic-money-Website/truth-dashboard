import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ActiveWallets from "./pages/ActiveWallets";
import CommunityPool from "./pages/CommunityPool";
import DexVolume from "./pages/DexVolume";
import GovernanceParticipation from "./pages/GovernanceParticipation";
import GovernanceProposals from "./pages/GovernanceProposals";
import GovernanceValidators from "./pages/GovernanceValidators";
import Volume from "./pages/Volume";
import CmcMostViewedRank from "./pages/CmcMostViewedRank";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/active-wallets" replace />} />
        <Route path="/active-wallets" element={<ActiveWallets />} />
        <Route path="/volume" element={<Volume />} />
        <Route path="/dex-volume" element={<DexVolume />} />
        <Route path="/cmc-most-viewed-rank" element={<CmcMostViewedRank />} />
        <Route path="/community-pool" element={<CommunityPool />} />
        <Route
          path="/governance/participation"
          element={<GovernanceParticipation />}
        />
        <Route path="/governance/validators" element={<GovernanceValidators />} />
        <Route path="/governance/proposals" element={<GovernanceProposals />} />
        <Route path="*" element={<Navigate to="/active-wallets" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
