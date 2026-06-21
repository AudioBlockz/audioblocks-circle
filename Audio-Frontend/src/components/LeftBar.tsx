"use client";
import { useState, useEffect } from "react";
import {
	ArrowRightToLine,
	CirclePlay,
	Gem,
	Headset,
	Music,
	Play,
	Pause,
} from "lucide-react";
import Link from "next/link";
import { handleListenerStat } from "@/hooks/ListenerStat";

// Define interfaces for component props and state
interface LeftBarProps {
	close: () => void;
	open?: () => void;
}

const LeftBar: React.FC<LeftBarProps> = ({ close }) => {
	const { listersStat } = handleListenerStat();

	function formatDuration(duration:any) {
		if (!duration || typeof duration !== "string") {
			return "Invalid duration";
		  } 
		  
		const hoursMatch = duration.match(/(\d+)h/);
		const minutesMatch = duration.match(/(\d+)m/);
		const secondsMatch = duration.match(/([\d.]+)s/);
	  
		const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
		const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
		const seconds = secondsMatch ? parseFloat(secondsMatch[1]).toFixed(2) : 0; // Keep 2 decimal places
	  
		return `${hours}h ${minutes}m ${seconds}s`;
	  }

	return (
		<>
			<div className="bg-[#0E070C] z-30 space-y-2 mt-5 p-6 rounded-3xl">
				<ArrowRightToLine
					className="md:hidden block text-white"
					onClick={close}
					size={16}
				/>
				<h2 className="text-base">Welcome Back</h2>
				<h1 className="text-white font-bold text-5xl">Wini</h1>
				<div className="text-gray-400">
					<h3 className="font-semibold text-sm text-gray-500 mb-4">
						Your STATS
					</h3>
					<ul className="text-sm space-y-2">
						<li className="text-gray-500 space-x-3 flex items-center">
							<Play className="w-4 h-4 cursor-pointer text-white" />

							<div className="text-white flex flex-col">
								<span>Total Stream Time:</span>
								<span className="text-[#666C6C]">
									{formatDuration(listersStat?.stats.totalStreamTime)}
								</span>
							</div>
						</li>
						<li className="text-gray-500 space-x-3 flex items-center">
							<Headset className="w-4 h-4" />
							<div className="text-white flex flex-col">
								<span>Streaming Points:</span>
								<span className="text-[#666C6C]">
									{listersStat?.stats.totalStreams} points
								</span>
							</div>
						</li>
					</ul>
				</div>
				<Link href="/" className="flex mt-10 items-center">
					<h1 className="md:text-2xl text-lg font-semibold text-gray-900">
						AudioBlocks
					</h1>
				</Link>
			</div>
		</>
	);
};

export default LeftBar;
