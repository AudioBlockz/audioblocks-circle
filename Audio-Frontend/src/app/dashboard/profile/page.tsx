"use client";
import { Pen, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { Twitter, Facebook } from "lucide-react";
import { useAccount } from "wagmi";
import axios from "axios";
import { Tooltip } from "react-tooltip";
import { toast } from "react-toastify";
import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";

export default function Profile() {
	const [isEditing, setIsEditing] = useState(false);
	const { address } = useAccount();
	const url = process.env.NEXT_PUBLIC_API_URL;
	const {
		artistProfileDetails,
		uploadProfile,
		fetchProfileDetails,
		uploadProfilePicture,
		writeToContract,
	} = uploadProfileDetails();
	const [profileDetails, setProfileDetails] = useState<any>({
		fullName: "",
		displayName: "",
		bio: "",
		location: "",
		nationality: "",
		twitter: "",
		facebook: "",
		instagram: "",
		walletAddress: address,
		profilePic: "https://via.placeholder.com/10",
	});
	const [profilePic, setProfilePic] = useState<File | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (!artistProfileDetails) {
			setIsEditing(true);
		} else {
			setIsEditing(false);
		}
	}, [artistProfileDetails]);


	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
		field: string,
	) => {
		setProfileDetails((prevState: any) => ({
			...prevState,
			[field]: e.target.value,
		}));
	};

	useEffect(() => {
		async function fetchProfile() {
			try {
				setProfileDetails((prevState: any) => ({
					...prevState,
					...artistProfileDetails,
					profilePic: artistProfileDetails?.profilePicture?.replace(
						"ipfs://",
						`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
					),
					walletAddress: address, // Ensure wallet address is correct
				}));
			} catch (error) {
				console.error("Failed to fetch profile details", error);
			}
		}

		fetchProfile();
	}, [address, artistProfileDetails]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setProfilePic(e.target.files[0]);
			const file = URL.createObjectURL(e.target.files[0]);
			setProfileDetails((prevState: any) => ({
				...prevState,
				profilePic: file,
			}));
		}
	};

	const toggleEditMode = () => {
		setIsEditing(!isEditing);
	};

	const handleSaveInfo = async (e: any) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const pictureHash = await uploadProfilePicture(profilePic!);

			const metadata = {
				fullName: profileDetails.fullName,
				displayName: profileDetails.displayName,
				bio: profileDetails.bio,
				location: profileDetails.location,
				nationality: profileDetails.nationality,
				twitter: profileDetails.twitter,
				facebook: profileDetails.facebook,
				instagram: profileDetails.instagram,
				profilePicture: `ipfs://${pictureHash}`,
			};
			setIsEditing(false);
			// Upload metadata JSON to IPFS using Pinata
			const metadatahash = await uploadProfile(metadata);
			console.log(metadatahash);
			if (metadatahash) {
				writeToContract(metadatahash);
				setProfileDetails((prevState: any) => ({
					...prevState,
					isEdited: true, // Prevent further edits
				}));
			}
			setIsLoading(false);
		} catch (error: any) {
			setIsLoading(false);
			toast.error("Failed to update profile", error.message);

			console.error("Failed to save profile", error.message);
		}
	};

	return (
		<section className="space-y-6 text-white rounded-xl shadow-xl mb-12">
			<h2 className="text-3xl font-semibold">My Profile</h2>
			<div className="flex items-center justify-between border-b pb-6 mb-6 border-[#2C2C2C]">
				<div className="relative w-32 h-32 rounded-full border-2 border-[#DC143C] overflow-hidden">
					<img
						src={profileDetails.profilePic}
						alt="Profile"
						className="object-cover w-full h-full rounded-full"
					/>
					{isEditing && (
						<>
							<label
								htmlFor="profile-pic"
								className="absolute bottom-2 right-2 bg-[#DC143C] text-white p-2 rounded-full cursor-pointer"
								data-tooltip-id="profile-pic-tooltip"
								data-tooltip-content="Upload Profile Picture"
							>
								<span className="text-sm">
									<Pencil size={14} />
								</span>
							</label>
							<Tooltip id="profile-pic-tooltip" />
						</>
					)}
				</div>

				<button
					onClick={isEditing ? handleSaveInfo : toggleEditMode}
					className="bg-[#DC143C] text-white px-6 py-2 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={profileDetails.isEdited}
					data-tooltip-id="edit-profile-tooltip"
					data-tooltip-content="Editing is disabled after saving."
				>
					{isEditing ? (
						isLoading ? (
							<div className="relative w-5 h-5 m-auto">
								<div className="absolute inset-0 border-2 border-blue-100 rounded-full animate-spin-slow"></div>
								<div className="absolute inset-0 border-2 border-pink-900 border-t-transparent rounded-full animate-spin"></div>
							</div>
						) : (
							"Save Profile"
						)
					) : (
						"Edit Profile"
					)}
				</button>
				<Tooltip id="edit-profile-tooltip" />
			</div>

			{isEditing && (
				<div className="mb-4 hidden">
					<label
						htmlFor="profile-pic"
						className="text-sm text-white font-semibold"
					>
						Upload Profile Picture
					</label>
					<input
						id="profile-pic"
						type="file"
						accept="image/*"
						onChange={handleImageChange}
						className="w-full bg-transparent border border-[#282325] px-3 py-2 text-white"
					/>
				</div>
			)}
			<div className="space-y-6">
				{/* Full Name */}
				<div>
					<label htmlFor="fullName" className="text-sm font-medium">
						Full Name
					</label>
					<input
						id="fullName"
						type="text"
						value={profileDetails.fullName}
						onChange={(e) => handleInputChange(e, "fullName")}
						disabled={!isEditing}
						placeholder="Enter Full Name"
						className="w-full bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
					/>
				</div>

				{/* Display Name */}
				<div>
					<label htmlFor="displayName" className="text-sm font-medium">
						Display Name
					</label>
					<input
						id="displayName"
						type="text"
						value={profileDetails.displayName}
						onChange={(e) => handleInputChange(e, "displayName")}
						disabled={!isEditing}
						placeholder="Enter Display Name"
						className="w-full bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
					/>
				</div>

				{/* Bio */}
				<div>
					<label htmlFor="bio" className="text-sm font-medium">
						Bio
					</label>
					<textarea
						id="bio"
						value={profileDetails.bio}
						onChange={(e) => handleInputChange(e, "bio")}
						disabled={!isEditing}
						placeholder="Tell us about yourself"
						className="w-full bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
						rows={4}
					/>
				</div>

				{/* Location */}
				<div>
					<label htmlFor="location" className="text-sm font-medium">
						Location
					</label>
					<input
						id="location"
						type="text"
						disabled={!isEditing}
						value={profileDetails.location}
						onChange={(e) => handleInputChange(e, "location")}
						placeholder="Enter your location"
						className="w-full bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
					/>
				</div>

				{/* Nationality */}
				<div>
					<label htmlFor="nationality" className="text-sm font-medium">
						Nationality
					</label>
					<input
						id="nationality"
						type="text"
						disabled={!isEditing}
						value={profileDetails.nationality}
						onChange={(e) => handleInputChange(e, "nationality")}
						placeholder="Enter your nationality"
						className="w-full bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
					/>
				</div>

				{/* Social Links */}
				<div className="flex space-x-4">
					{/* Twitter */}
					<div className="relative w-full">
						<label
							htmlFor="twitter"
							className="text-sm text-white font-semibold"
						>
							Twitter
						</label>
						<div className="absolute left-3  top-2/3  transform -translate-y-1/2">
							<Twitter className="text-white" size={20} />
						</div>
						<input
							id="twitter"
							type="text"
							value={profileDetails.twitter}
							onChange={(e) => handleInputChange(e, "twitter")}
							disabled={!isEditing}
							placeholder="Twitter Handle"
							className="w-full pl-10 bg-transparent rounded-full border border-[#282325] px-3 py-2 text-white focus:outline-none focus:shadow-sm focus:shadow-[#FF9393]"
						/>
					</div>

					{/* Facebook */}
					<div className="relative w-full">
						<label
							htmlFor="facebook"
							className="text-sm text-white font-semibold"
						>
							Facebook
						</label>
						<div className="absolute left-3 top-2/3 transform -translate-y-1/2">
							<Facebook className="text-white" size={20} />
						</div>
						<input
							id="facebook"
							type="text"
							value={profileDetails.facebook}
							onChange={(e) => handleInputChange(e, "facebook")}
							disabled={!isEditing}
							placeholder="Facebook Handle"
							className="w-full pl-10 bg-transparent rounded-full border border-[#282325] px-3 py-2 text-white focus:outline-none focus:shadow-sm focus:shadow-[#FF9393]"
						/>
					</div>
				</div>

				{/* Instagram */}
				<div>
					<label htmlFor="instagram" className="text-sm font-medium">
						Instagram
					</label>
					<input
						id="instagram"
						type="text"
						value={profileDetails.instagram}
						onChange={(e) => handleInputChange(e, "instagram")}
						placeholder="Instagram Handle"
						className="w-full bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
					/>
				</div>

				{/* Wallet Address */}
				<div className="mt-6">
					<h3 className="text-xl font-semibold">Wallet Address</h3>
					<div className="flex flex-col md:flex-row justify-between items-center py-3 mb-4 border-b border-[#2C2C2C]">
						<input
							id="wallet-address"
							type="text"
							value={profileDetails.walletAddress}
							disabled
							placeholder="Enter Wallet Address"
							className="md:w-4/5 w-full md:mb-0 mb-3 bg-transparent rounded-lg border border-[#2C2C2C] px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#DC143C]"
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
