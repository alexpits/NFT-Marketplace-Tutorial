//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NFTMarketplace is ERC721URIStorage, IERC721Receiver {

    using SafeMath for uint256;
    using Counters for Counters.Counter;
    //_tokenIds variable has the most recent minted tokenId
    Counters.Counter private _tokenIds;
    //Keeps track of the number of items sold on the marketplace
    Counters.Counter private _itemsSold;
    //owner is the contract address that created the smart contract
    address payable owner;
    //The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.01 ether;
    // Creator royalty %
    uint256 royaltyPercent = 10;

    //The structure to store info about a listed token
    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }

    //the event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    //This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    // mapping(uint256 => ListedToken) private idToListedToken;
    mapping(address => mapping(uint256 => ListedToken)) private idToListedToken;

    // Creators who receive royalties
    mapping(uint256 => address payable) private creators;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update listing price");
        listPrice = _listPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getListedTokenForId(address nftAddress, uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[nftAddress][tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    //The first time a token is created, it is listed here
    function createToken(string memory tokenURI) public returns (uint) {
        //Increment the tokenId counter, which is keeping track of the number of minted NFTs
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        //Mint the NFT with tokenId newTokenId to the address who called createToken
        _safeMint(msg.sender, newTokenId);

        //Map the tokenId to the tokenURI (which is an IPFS URL with the NFT metadata)
        _setTokenURI(newTokenId, tokenURI);

        creators[newTokenId] = payable(msg.sender);

        return newTokenId;
    }

    function createListedToken(address nftAddress, uint256 tokenId, uint256 price) public payable {
        //Make sure the sender sent enough ETH to pay for listing
        require(msg.value == listPrice, "Hopefully sending the correct price");
        //Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        ListedToken memory listing = idToListedToken[nftAddress][tokenId];
        require(!listing.currentlyListed, "Already listed");

        IERC721 nft = IERC721(nftAddress);
        require(msg.sender == nft.ownerOf(tokenId), "Not owner");
        require(nft.getApproved(tokenId) == address(this), "Not approved for marketplace");

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

         //Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[nftAddress][tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true
        );

        //Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }
    
    function executeSale(address nftAddress, uint256 tokenId) public payable {
        ListedToken memory listing = idToListedToken[nftAddress][tokenId];
        require(msg.value == listing.price, "Please submit the asking price in order to complete the purchase");

        _itemsSold.increment();

        //Actually transfer the token to the new owner
        IERC721 nft = IERC721(nftAddress);
        nft.approve(msg.sender, tokenId);
        nft.safeTransferFrom(address(this), msg.sender, tokenId);

        //Transfer the listing fee to the marketplace creator
        payable(owner).transfer(listPrice);

        //Transfer the proceeds from the sale to the seller and creator of the NFT
        if (creators[tokenId] != address(0)) {
            uint256 royalty = msg.value.mul(royaltyPercent).div(uint256(100));
            uint256 price = msg.value.sub(royalty);

            (bool sent,) = payable(listing.seller).call{value: price}("");
            require(sent, "Failed to send Ether to seller");

            (sent,) = payable(creators[tokenId]).call{value: royalty}("");
            require(sent, "Failed to send Ether to creator");
        } else {
            (bool sent,) = payable(listing.seller).call{value: msg.value}("");
            require(sent, "Failed to send Ether to seller");
        }

        delete (idToListedToken[nftAddress][tokenId]);
    }
}
