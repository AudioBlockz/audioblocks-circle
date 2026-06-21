import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export const SongLikes = () => {
	const [likes, setLikes] = useState<number | null>(null);
    const url = process.env.NEXT_PUBLIC_API_URL;
	const jwt = Cookies.get("audioblocks_jwt");

	
		const fetchLikes = async (songId: any) => {
			try {
				const response = await axios.get(
					`${url}/song/getlikes/${songId}`,
					{
						headers: {
							Authorization: `Bearer ${jwt}`,
						},
					},
				);
				const data = response.data;
				if (data.success) {
					setLikes(data.data.totalLikes);
                    
				}
			} catch (error) {
				console.error("Error fetching likes:", error);
			}
		};

		


	return {
		likes,
        fetchLikes
	};
};

