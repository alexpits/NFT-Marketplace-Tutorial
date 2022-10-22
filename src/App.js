import './App.css';
import Navbar from './components/Navbar.js';
import Marketplace from './components/Marketplace';
import Profile from './components/Profile';
import MintNFT from './components/MintNFT';
import NFTPage from './components/NFTpage';
import ProfileNFTPage from './components/ProfileNFTpage';
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

function App() {
  return (
    <div className="container">
        <Routes>
          <Route path="/" element={<Marketplace />}/>
          <Route path="/nftPage" element={<NFTPage />}/>
          <Route path="/nftPage" element={<ProfileNFTPage />}/>     
          <Route path="/profile" element={<Profile />}/>
          <Route path="/mintNFT" element={<MintNFT />}/>             
        </Routes>
    </div>
  );
}

export default App;
