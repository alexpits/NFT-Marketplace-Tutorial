import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import { useState } from "react";
import Marketplace from '../Marketplace.json';

export default function ProfileNFTPage(props) {

    const ethers = require("ethers");
    const [formParams, updateFormParams] = useState({ price: ''});
    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");

    async function getNFTData(contractAddress, tokenId) {

        let fetchURL = process.env.REACT_APP_ALCHEMY_API_URL 
            + `/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
        var requestOptions = {
            method: 'GET'
        };

        const result = await fetch(fetchURL, requestOptions).then(data => data.json());
        console.log(result);

        let item = {
            contract: contractAddress,
            tokenId: Number(tokenId),
            image: result.metadata.image,
            name: result.metadata.name,
            description: result.metadata.description
        }
        console.log(item);
        updateData(item);
        updateDataFetched(true);
    }

    async function listNFT(nftAddress, tokenId) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        updateMessage("Please wait... sending approval request (up to 5 mins)");

        console.log("Approving Marketplace as operator of NFT...");
        const erc721abi = [
            "function approve(address to, uint256 tokenId)"
        ];
        const nftContract = new ethers.Contract(nftAddress, erc721abi, signer);
        const approvalTx = await nftContract.approve(Marketplace.address, tokenId);
        await approvalTx.wait();

        updateMessage("Please wait... listing (up to 5 mins)");

        //Pull the deployed contract instance
        let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);

        // Message the params to be sent to the create NFT request
        const price = ethers.utils.parseUnits(formParams.price, 'ether');
        let listingPrice = await contract.getListPrice();
        listingPrice = listingPrice.toString();

        let transaction = await contract.createListedToken(nftAddress, tokenId, price, { value: listingPrice });
        await transaction.wait();

        alert("Successfully listed your NFT!");
        updateMessage("");
        updateFormParams({ price: '' });
        window.location.replace("/")
    }

    const params = useParams();
    const contractAddress = params.contract;
    const tokenId = params.tokenId;

    if(!dataFetched)
        getNFTData(contractAddress, tokenId);

    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-1/3" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Collection Address: <span className="text-sm">{data.contract}</span>
                    </div>
                    <div>
                        Token Id: {data.tokenId}
                    </div>
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                    <div className="mb-6">
                        <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="price">Price (in ETH)</label>
                        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 0.01 ETH" step="0.01" 
                            value={formParams.price} onChange={e => updateFormParams({...formParams, price: e.target.value})}
                        ></input>
                    </div>
                    <div className="text-green text-center">{message}</div>
                    <button 
                        onClick={() => listNFT(data.contract, data.tokenId)}
                        className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg w-100">
                        List NFT
                    </button>
                    </div>
                </div>
            </div>
        </div>
    )
}