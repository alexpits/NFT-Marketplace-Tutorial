import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import { useState } from "react";

export default function NFTPage (props) {

const [data, updateData] = useState({});
const [dataFetched, updateDataFetched] = useState(false);
const [message, updateMessage] = useState("");
const [currAddress, updateCurrAddress] = useState("0x");

async function getNFTData(nftAddress, tokenId) {

    let fetchURL = process.env.REACT_APP_ALCHEMY_API_URL 
    + `/getNFTMetadata?contractAddress=${nftAddress}&tokenId=${tokenId}`;
    var requestOptions = {
        method: 'GET'
    };
    let meta = await fetch(fetchURL, requestOptions).then(data => data.json());
    console.log(meta);
    meta = meta.metadata;

    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const addr = await signer.getAddress();
    //Pull the deployed contract instance

    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
    const listedToken = await contract.getListedTokenForId(nftAddress, tokenId);
    console.log(listedToken);

    let item = {
        price: ethers.utils.formatUnits(listedToken.price, 'ether'),
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
    }
    console.log(item);
    updateData(item);
    updateDataFetched(true);
    console.log("address", addr);
    updateCurrAddress(addr);
}

async function buyNFT(nftAddress, tokenId) {
    try {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        const salePrice = ethers.utils.parseUnits(data.price, 'ether');
        updateMessage("Buying the NFT... Please Wait (up to 5 mins)");

        //run the executeSale function
        let transaction = await contract.executeSale(nftAddress, tokenId, {value:salePrice});
        await transaction.wait();

        alert('You successfully bought the NFT!');
        updateMessage("");
        window.location.replace("/profile");
    }
    catch(e) {
        alert("Upload Error"+e)
    }
}

    const params = useParams();
    const nftAddress = params.contract;
    const tokenId = params.tokenId;

    if(!dataFetched)
        getNFTData(nftAddress, tokenId);

    return(
        <div>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                    { currAddress == data.owner || currAddress == data.seller ?
                        <div className="text-emerald-700">You are the owner of this NFT</div>
                        : <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(nftAddress, tokenId)}>Buy this NFT</button>
                    }
                    
                    <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}