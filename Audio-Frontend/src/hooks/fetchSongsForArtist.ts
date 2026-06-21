// import { useEffect, useState } from "react";
// import axios from "axios";
// import { contractAddress, abi } from "@/config/abi";
// import {
// 	useWaitForTransactionReceipt,
// 	useWriteContract,
// 	useReadContract,
// 	useReadContracts,
// } from "wagmi";
// import { useAccount } from "wagmi";

// export const fetchArtist = () => {
// 	const { address } = useAccount();
// 	const [artists, setArtist] = useState<any[]>([]);

// 	const { data: artistIds, isSuccess }: any = useReadContract({
// 		address: contractAddress,
// 		abi: abi,
// 		functionName: "getArtistById",
//         args:[]
// 		account: address,
// 	});

// 	const { data: song, isSuccess:success } = useReadContract({
// 		address: contractAddress,
// 		abi: abi,
// 		functionName: "getArtistSongs",
// 	    args:[data?.artistAddress],
// 		account: address,
// 	});
// 	console.log(song);
// 	const fetchProfileDetails = async (profileDataArray: any[]) => {
// 		try {
// 			const profiles = [];
// 			for (const profileData of profileDataArray) {
				
// 				const gateway = profileData.result.artistCid.replace(
// 					"ipfs://",
// 					`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
// 				);
// 				const response = await axios.get(gateway, {
// 					headers: {
// 						"Content-Type": "application/json",
// 					},
// 				});
// 				const profileWithAddress = {
// 					...response.data, 
// 					address: profileData.result.artistAddress,
// 				};
// 				profiles.push(profileWithAddress);
// 			}
// 			setArtist(profiles);
// 		} catch (error: any) {
// 			console.error("Error fetching profile details:", error.message);
// 		}
// 	};
	
	

// 	useEffect(() => {
// 		if (data && success) {
// 			fetchProfileDetails(data);
// 		}
// 	}, [data, success]);
	

// 	return {
		
// 	};
// };
