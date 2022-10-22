import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import { useState } from "react";

export default function Marketplace() {

const [data, updateData] = useState([]);
const [dataFetched, updateFetched] = useState(false);
const [collection, setCollectionAddress] = useState("");

async function fetchNFTs() {
    console.log("fetching nfts");
    let fetchURL = process.env.REACT_APP_ALCHEMY_API_URL + `/getNFTs?owner=${MarketplaceJSON.address}`;

    if (collection.length) {
        fetchURL = fetchURL + `&contractAddresses%5B%5D=${collection}`;
    }

    var requestOptions = {
        method: 'GET'
      };

    const result = await fetch(fetchURL, requestOptions).then(data => data.json());

    let items = result.ownedNfts.map(function(nft) {
            return {
                price: nft.metadata.price,
                tokenId: nft.id.tokenId,
                contract: nft.contract.address,
                image: nft.metadata.image,
                name: nft.metadata.name,
                description: nft.metadata.description
            };
        }
    );

    updateFetched(true);
    updateData(items);
}

if(!dataFetched)
    fetchNFTs();

return (
    <div>
        <Navbar></Navbar>
        <input className="mx-5 shadow appearance-none border rounded w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Add the collection address" 
            onChange={(e)=>{setCollectionAddress(e.target.value)}} value={collection}></input>
        <button onClick={fetchNFTs} className="font-bold mt-10 w-1/6 bg-purple-500 text-white rounded p-2 shadow-lg">
            Fetch NFTs
        </button>
        <div className="flex flex-col place-items-center mt-20">
            <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                {data.map((value, index) => {
                    return <NFTTile data={value} key={index} pathname="/NFTPage/"></NFTTile>;
                })}
            </div>
        </div>            
    </div>
);

}