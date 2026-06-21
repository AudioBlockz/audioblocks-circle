import { uploadProfileDetails } from "@/hooks/uploadProfileDetails";

import axios from "axios";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import moment from 'moment';

const CommentSection = (songid: any) => {
	const { artistProfileDetails } = uploadProfileDetails();
	const [comments, setComments] = useState<any[]>([]);
	const url = process.env.NEXT_PUBLIC_API_URL;
	const jwt = Cookies.get("audioblocks_jwt");

	const [newComment, setNewComment] = useState("");


	const handleAddComment = async () => {
		if (newComment.trim() === "") return;

		try {
			// Send the POST request
			const response = await axios.post(
				`${url}/song/comment`,
				{
					songId: songid.songid,
					comment: newComment,
				},
				{
					headers: {
						Authorization: `Bearer ${jwt}`,
					},
				},
			);
			
					
		} catch (error) {
			console.error("Error submitting comment:", error);
		}
	};

	const fetchComments = async () => {
		try {
			const response = await axios.get(`${url}/song/comment/${songid.songid}`, {
				headers: {
					Authorization: `Bearer ${jwt}`,
				},
			});

			// Check if the response is successful
			if (response.data.success) {
				const fetchedComments = response.data.data;
				// Update the comments state with the fetched comments
				setComments(
					fetchedComments.map((comment: any) => ({
						id: comment._id,
						name: comment.address, // Assuming address is used as name, change as needed
						time: comment.createdAt, // You can format this time if necessary
						text: comment.comment, // The actual comment
					})),
				);
			} else {
				console.error("Failed to fetch comments");
			}
		} catch (error) {
			console.error("Error fetching comments:", error);
		}
	};

	useEffect(() => {
		// Assuming `songId` is available
		fetchComments(); // Replace with the actual songId
	}, []);

	return (
		<div className="bg-black text-white mt-10 mb-40 rounded-md space-y-6 w-full mx-auto">

			<div className="flex justify-between items-center border-b border-gray-700">
				<h2 className="text-lg font-semibold">{comments.length} comments</h2>
			</div>
			<div className="space-y-4">
				{comments.map((comment) => (
					<div key={comment.id} className="flex  gap-4">
						<div className="md:w-10 w-5 h-5 md:h-10 rounded-full bg-gray-700">
							<img
								src="/images/Rectangle1.png"
								className="object-cover w-full h-full rounded-full"
								alt="image"
							/>
						</div>
						<div>
							<div className="flex items-center space-x-2">

								<h4 className="font-semibold text-ellipsis">{comment.name.slice(0, 10)}...</h4>
								<span className="text-sm text-gray-500"><span className="text-white h-1 w-1 items-center rounded-full bg-white inline-block"></span> {moment(comment.time).fromNow()}</span>

							</div>
							<p className="text-sm text-gray-300">{comment.text}</p>
						</div>
					</div>
				))}
			</div>
			<div className="flex flex-col space-y-4">
				<textarea
					className="bg-[#ffffff27] text-gray-300 p-3 rounded-md resize-none focus:outline-none "
					placeholder="What are your thoughts?"
					rows={3}
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
				/>
				<div className="flex justify-start space-x-2">
					<button
						onClick={handleAddComment}
						className="px-8 py-1 bg-[#B21988] text-white rounded-md"
					>
						Reply
					</button>
					<button
						onClick={() => setNewComment("")}
						className="px-6 py-1  text-gray-300 rounded-md hover:bg-gray-500"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default CommentSection;
