"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchArtist } from "@/hooks/fetchArtist";
import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";

// Skeleton for artist cards
const SkeletonCard = () => (
	<div className="rounded-lg shadow-lg flex items-center flex-col overflow-hidden">
		<div className="w-20 h-20 md:w-40 md:h-40 rounded-full bg-gray-700 animate-pulse mb-4"></div>
		<div className="h-4 w-24 bg-gray-700 animate-pulse rounded"></div>
	</div>
);

const Artist = () => {

	const route = useRouter();
	const { artists, isLoading } = fetchArtist(); // Fetch artists and loading state
	// State to manage the selected genre
	const [selectedGenre, setSelectedGenre] = useState<string>("All");
	const { artistProfileDetails, isLoading: isLoadingProfile } = uploadProfileDetails();

	useEffect(() => {
		if (!isLoadingProfile && !artistProfileDetails) {
			route.push("/dashboard/profile");
		}
	}, [artistProfileDetails, isLoadingProfile, route]);

	// Memoize filtered artists to prevent re-calculation
	const filteredArtists = useMemo(() => {
		if (selectedGenre === "All") return artists;
		return artists.filter(
			(artist) => artist.genre.toLowerCase() === selectedGenre.toLowerCase(),
		);
	}, [artists, selectedGenre]);

	// Navigate to artist's page
	const handleClick = (artistId: string) => {
		route.push(`/dashboard/artist/${artistId}`);
	};

	// Genre list for filtering
	const genres = [
		"All",
		"Pop",
		"Christian",
		"Hip-Hop",
		"Rock Music",
		"R&B Music",
		"Electronic Music",
		"Country Music",
	];

	return (
		<>
			{/* Genre Filter */}
			<div className="text-white">
				<div className="flex gap-4 text-sm flex-wrap">
					{genres.map((genre) => (
						<button
							key={genre}
							className={`border border-gray-800 hover:bg-pink-600 text-white px-4 py-2 rounded-full ${
								selectedGenre === genre ? "bg-pink-600" : ""
							}`}
							onClick={() => setSelectedGenre(genre)}
						>
							{genre}
						</button>
					))}
				</div>
			</div>

			{/* Artist Grid */}
			<div className="grid md:grid-cols-4 grid-cols-2 w-full gap-6 mt-10">
				{isLoading ? (
					// Render Skeleton Loader
					[...Array(8)].map((_, index) => <SkeletonCard key={index} />)
				) : filteredArtists.length > 0 ? (
					// Render Artists
					filteredArtists.map((artist) => (
						<div
							key={artist.id}
							onClick={() => handleClick(artist.id)}
							className="cursor-pointer"
						>
							<div className="rounded-lg shadow-lg flex items-center flex-col overflow-hidden">
								<div className="rounded-full">
									<img
										src={artist.profilePicture.replace(
											"ipfs://",
											`https://${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/`,
										)}
										alt={artist.fullName}
										className="md:w-40 w-20 rounded-full md:h-40 h-20 object-cover"
									/>
								</div>
								<div className="p-4 pt-2 md:text-center text-left">
									<p className="text-sm text-gray-400">{artist.fullName}</p>
								</div>
							</div>
						</div>
					))
				) : (
					// No Artists Found Message
					<div className="text-center col-span-4 text-gray-400">
						No artists found in{" "}
						<span className="font-bold">{selectedGenre}</span>.
					</div>
				)}
			</div>
		</>
	);
};

export default Artist;
