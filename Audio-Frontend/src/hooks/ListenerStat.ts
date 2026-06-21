import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";


export const handleListenerStat = () => {

    const url = process.env.NEXT_PUBLIC_API_URL;
    const jwt = Cookies.get("audioblocks_jwt");
    const [listersStat, setListernerStat] = useState<any>(null);

	const listenerStat = async () => {
		try {
			const response = await axios.get(`${url}/user/get-listerner-stats`, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${jwt}`,
				},
			});

			if (response) {
				setListernerStat(response.data.data);
			}
		} catch (err: any) {
			console.log(err.message);
		}
	};

	useEffect(() => {
		listenerStat();
	}, [url, jwt]);

	return {
		listersStat,
	};
};
