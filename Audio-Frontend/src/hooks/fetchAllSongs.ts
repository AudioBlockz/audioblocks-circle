import { useEffect, useState } from "react";
import axios from "axios";
import { contractAddress, abi } from "@/config/abi";
import {
	useReadContract,
	useReadContracts,
} from "wagmi";
import { useAccount } from "wagmi";

export const fetchAllSongs = () => {
	const { address } = useAccount();

	const [musics, setMusic] = useState<any[]>([]);

	const [isLoading, setIsLoading]=useState(false);

	const { data: musicIds, isSuccess }:any = useReadContract({
		address: contractAddress,
		abi: abi,
		functionName: "getAllSongIds",
		account: address,
	});

	const { data, isSuccess: success }:any = useReadContracts({
		contracts:
        musicIds?.map((musicId:any) => ({
				abi: abi,
				address: contractAddress,
				functionName: "getSongById",
				args: [musicId],
				account: address,
			})) || [],
	});



	const fetchMusicDetails = async (musicDataArray: any[]) => {
		try {
			const music = [];
			setIsLoading(true)
			for (const musicData of musicDataArray) {
				
				
				const gateway = musicData.result.songCID.replace(
					"ipfs://",
					`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
				);
				const response = await axios.get(gateway, {
					headers: {
						"Content-Type": "application/json",
					},
				});
				const musicWithAddress = {
					...response.data, 
					songId: Number(musicData.result.songId),
					artistAddress: musicData.result.artistAddress,
				};
				
				music.push(musicWithAddress);
			}
			setMusic(music);

			setIsLoading(false)
		} catch (error: any) {
			setIsLoading(false);
			console.error("Error fetching profile details:", error.message);
		}
	};
	
	

	useEffect(() => {
		if (data && success) {
			fetchMusicDetails(data);
			
		}
	}, [data, success]);
	

	return {
		fetchMusicDetails,
		musics,
		isLoading
	};
};
