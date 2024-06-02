import axie from "../tile.jpeg";
import {
    BrowserRouter as Router,
    Link,
  } from "react-router-dom";
  import { GetIpfsUrlFromPinata } from "../utils";

function NFTTile (data) {
    const newTo = {
        pathname:"/nftPage/"+data.data.tokenId
    }

    const IPFSUrl = GetIpfsUrlFromPinata(data.data.image);
    //bg-gradient-to-t from-[#454545]

    return (
        <Link to={newTo}>
        <div className="border-2 ml-12 mt-5 mb-12 flex flex-col items-center rounded-lg w-48 md:w-72 shadow-2xl">
            <img src={IPFSUrl} alt="" className="w-72 h-80 rounded-lg object-cover" crossOrigin="anonymous" />
            <div className= "text-black w-full p-2  to-transparent rounded-lg pt-5 -mt-20 bg-white">
                <strong className="text-xl">{data.data.name}</strong>
                <p className="display-inline">
                    {data.data.description}
                </p>
            </div>
        </div>
        </Link>
    )
}

export default NFTTile;