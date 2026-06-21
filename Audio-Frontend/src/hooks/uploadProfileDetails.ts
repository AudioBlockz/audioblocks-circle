import { useEffect, useState } from "react";
import axios from "axios";
import {
	generateRandomFileName,
	generateRandomSongTitle,
	replaceSpecialCharacters,
} from "@/lib/helper";
import { toast } from "react-toastify";
import { contractAddress, abi } from "@/config/abi";
import {
	useWaitForTransactionReceipt,
	useWriteContract,
	useReadContract,
} from "wagmi";
import { useAccount } from "wagmi";

interface ArtistProfileDetails {
	bio: string;
	facebook: string;
	fullName: string;
	genre: string;
	instagram: string;
	location: string;
	nationality: string;
	profilePicture: string;
	twitter: string;
}

export const uploadProfileDetails = () => {
	const { address } = useAccount();
	const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
	const [artistProfileDetails, setArtistProfileDetails] =
		useState<ArtistProfileDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const { writeContractAsync } = useWriteContract();

	const uploadProfilePicture = async (file: File) => {
		const formData = new FormData();
		const randomFileName = generateRandomFileName(file.name);
		const renamedFile = new File([file], randomFileName, { type: file.type });
		formData.append("file", renamedFile);

		try {
			const response = await axios.post(
				`https://api.pinata.cloud/pinning/pinFileToIPFS`,
				formData,
				{
					maxContentLength: Infinity, // Prevents larger file restrictions
					headers: {
						"Content-Type": `multipart/form-data;`,
						Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
						pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
						pinata_secret_api_key:
							process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
					},
				},
			);
			return response.data.IpfsHash;
		} catch (err: any) {
			console.error("Error uploading file to Pinata:", err);
			toast.error("Error uploading file to Pinata", err.message);
		}
	};

	const uploadProfile = async (json: any) => {
		console.log("Original JSON:", json);

		const profileName = json.fullName;
		const formattedName = replaceSpecialCharacters(profileName);
		console.log("Formatted Name:", formattedName);

		const pinataPayload = {
			pinataContent: json, // Your actual JSON content to upload
			pinataMetadata: {
				name: formattedName,
			},
			pinataOptions: {
				groupId: process.env.NEXT_PUBLIC_PINATA_USER_GROUP,
			},
		};

		try {
			const response = await axios.post(
				`https://api.pinata.cloud/pinning/pinJSONToIPFS`,
				pinataPayload,
				{
					headers: {
						Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
						pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
						pinata_secret_api_key:
							process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
					},
				},
			);

			console.log("Pinata response:", response.data.IpfsHash);

			return response.data.IpfsHash;
		} catch (err: any) {
			console.error("Error uploading JSON to Pinata:", err);
			toast.error("Error uploading JSON to Pinata:", err.message);
		}
	};

	const writeToContract = async (profileHash: any) => {
		try {
			const tx = await writeContractAsync({
				abi: abi,
				address: contractAddress,
				functionName: "setUpUserProfile",
				args: [`ipfs://${profileHash}`],
				account: address,
			});
			setTxHash(tx);
			toast.success("Profile Submitted. Waiting for confirmation...");
		} catch (error: any) {
			console.error("Error creating profile:", error);
			toast.error("Error creating profile: " + error.message);
		}
	};
	const { isLoading: isConfirming, isSuccess: isConfirmed } =
		useWaitForTransactionReceipt({
			hash: txHash ?? undefined,
		});

	useEffect(() => {
		if (isConfirmed) {
			toast.success("Profile created successfully");
		}
	}, [isConfirmed]);

	const { data, isSuccess } = useReadContract({
		address: contractAddress,
		abi: abi,
		functionName: "getStreamerByAddress",
		args: [address],
		account: address,
	});

	const fetchProfileDetails = async (profileData: any) => {
		setIsLoading(true);
		try {
			const gateway = profileData?.cid.replace(
				"ipfs://",
				`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
			);
			const response = await axios.get(gateway, {
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await response.data;
			setArtistProfileDetails(data);
			setIsLoading(false)
		} catch (error: any) {
			setIsLoading(false)
			console.error("Error fetching profile details:", error.message);
		}
	};

	useEffect(() => {
		if (data && isSuccess) {
			fetchProfileDetails(data);
		}
	}, [data, isSuccess]);

	return {
		uploadProfile,
		uploadProfilePicture,
		writeToContract,
		fetchProfileDetails,
		isLoading,
		artistProfileDetails,
	};
};
