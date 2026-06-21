"use client";

export const WIPBanner = () => {
	if (typeof window === "undefined") {
		return null; // Prevent rendering on the server
	}

	return (
		<>
			<div className="bg-yellow-500 text-black top-0 sticky z-50 text-center py-2">
				<p>
					{" "}
					🚧 We are currently under development. Some features may not be fully
					functional. 🚀
				</p>
			</div>
		</>
	);
};
