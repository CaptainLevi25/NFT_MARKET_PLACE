// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract NFTMarketplace is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    address payable owner;
    address public oracleAddress;
    uint256 public constant DECIMALS = 18; // ETH decimals

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 priceInWei;
        bool currentlyListed;
    }

    mapping(uint256 => ListedToken) private idToListedToken;

    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 priceInWei,
        bool currentlyListed
    );

    constructor(address _oracleAddress) ERC721("NFTMarketplace", "NFTM") {
        oracleAddress = _oracleAddress;
        owner = payable(msg.sender);
    }

    function getLatestEthPrice() public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(oracleAddress);
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        require(answer > 0, "Invalid Chainlink price feed data");
        return uint256(answer);
    }

    function calculatePlatformFee(uint256 price) public pure returns (uint256) {
        return price * 10 / 100;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    function createToken(string memory tokenURI, uint256 priceInUsd) public returns (uint) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        uint256 ethPrice = getLatestEthPrice();
        uint256 ethPriceInWei = (priceInUsd * (10 ** DECIMALS)) / ethPrice;

        createListedToken(newTokenId, ethPriceInWei);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 priceInWei) private {
        require(priceInWei > 0, "Make sure the price isn't negative");

        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            priceInWei,
            true
        );

        _transfer(msg.sender, address(this), tokenId);
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            priceInWei,
            true
        );
    }

    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            uint currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }
        return tokens;
    }

    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for (uint i = 0; i < totalItemCount; i++) {
            if (idToListedToken[i + 1].owner == msg.sender || idToListedToken[i + 1].seller == msg.sender) {
                uint currentId = i + 1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function executeSale(uint256 tokenId) public payable {
        uint256 price = idToListedToken[tokenId].priceInWei;
        address seller = idToListedToken[tokenId].seller;
        uint256 platformFee = calculatePlatformFee(price);
        require(msg.value == price + platformFee, "Please submit the asking price plus platform fee in order to complete the purchase");

        idToListedToken[tokenId].currentlyListed = false;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        _transfer(address(this), msg.sender, tokenId);
        approve(address(this), tokenId);

        payable(owner).transfer(platformFee);
        payable(seller).transfer(price);
    }
}