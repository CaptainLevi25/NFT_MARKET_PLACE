import Navbar from "./Navbar";
import axie from "../tile.jpeg";
import { useLocation, useParams } from "react-router-dom";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { GetIpfsUrlFromPinata } from "../utils";
export default function NFTPage(props) {
  const [data, updateData] = useState({});
  const [dataFetched, updateDataFetched] = useState(false);
  const [message, updateMessage] = useState("");
  const [currAddress, updateCurrAddress] = useState("0x");
  const [sellingprice, setfinalprice] = useState();
  async function getNFTData(tokenId) {
    try {
      const ethers = require("ethers");
      //After adding your Hardhat network to your metamask, this code will get providers and signers
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tx = await provider.send("eth_requestAccounts", []);
      // tx.wait();
      const signer = provider.getSigner();
      const addr = await signer.getAddress();
      //Pull the deployed contract instance
      let contract = new ethers.Contract(
        MarketplaceJSON.address,
        MarketplaceJSON.abi,
        signer
      );
      //create an NFT Token
      var tokenURI = await contract.tokenURI(tokenId);
      var latest = await contract.getLatestEthPrice();
      console.log(latest);
      const listedToken = await contract.getListedTokenForId(tokenId);
      console.log(parseInt(listedToken.priceInWei));
      const prefinal = listedToken.priceInWei;
      const finalprice = parseInt(listedToken.priceInWei) / Math.pow(10, 18);

      console.log(finalprice);
      setfinalprice(prefinal);
      tokenURI = GetIpfsUrlFromPinata(tokenURI);
      let meta = await axios.get(tokenURI);
      meta = meta.data;
      console.log(meta);
      console.log(data.price);
      console.log(listedToken);

      let item = {
        //  price: meta.price,
        price: finalprice,
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
      };
      console.log(item);
      updateData(item);
      updateDataFetched(true);
      console.log("address", addr);
      updateCurrAddress(addr);
    } catch (e) {
      console.log("error in getNftdata", e);
    }
  }

  async function buyNFT(tokenId) {
    try {
      const ethers = require("ethers");
      //After adding your Hardhat network to your metamask, this code will get providers and signers
      const provider = await new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();

      //Pull the deployed contract instance
      let contract = new ethers.Contract(
        MarketplaceJSON.address,
        MarketplaceJSON.abi,
        signer
      );
      console.log("before sell");

      console.log("selling price ", sellingprice);
      const sellingpriceinwei = sellingprice * Math.pow(10, 18);

      const realplatformfee = await contract.calculatePlatformFee(sellingprice);

      console.log("realplatformfee : ", realplatformfee);
      console.log("selling price in wei", sellingpriceinwei);

      const finalcost = sellingprice.add(realplatformfee);
      console.log("finalcost", finalcost);
      const finalcostinstring = finalcost.toString();
      console.log(" finalcostinstring ", finalcostinstring);
      //  console.log("final cost ", finalcost);
      
      const salePrice = ethers.utils.parseUnits(finalcostinstring, "wei");
       console.log("salesPrice : ", salePrice);

      updateMessage("Buying the NFT... Please Wait (Upto 5 mins)");
      //run the executeSale function
      let transaction = await contract.executeSale(tokenId, {
        value: salePrice,
      });
      await transaction.wait();

      alert("You successfully bought the NFT!");
      updateMessage("");
    } catch (e) {
      console.log("Upload Error" + e);
    }
  }

  const params = useParams();
  const tokenId = params.tokenId;
  console.log(tokenId);
  if (dataFetched == false) {
    getNFTData(tokenId);
    console.log(data);
  }
  if (typeof data.image == "string")
    data.image = GetIpfsUrlFromPinata(data.image);

  return (
    <div style={{ "min-height": "100vh" }}>
      <Navbar></Navbar>
      <div className="flex ml-20 mt-20">
        <img src={data.image} alt="" className="w-2/5" />
        <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
          <div>Name: {data.name}</div>
          <div>Description: {data.description}</div>
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
            {
              //currAddress != data.owner && currAddress != data.seller ?
              <button
                className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                onClick={() => buyNFT(tokenId)}
              >
                Buy this NFT
              </button>
              //  :

              //  (
              //   <div className="text-emerald-700">
              //     You are the owner of this NFT
              //   </div>
              // )
            }

            <div className="text-green text-center mt-3">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
