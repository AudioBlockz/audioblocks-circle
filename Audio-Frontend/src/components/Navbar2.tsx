import Link from "next/link";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useEffect, useState } from "react";
import { ConnectBtn } from "./ConnectBtn";
import axios from "axios";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import AvatarDropdown from "./Dropdown";
import EmailVerificationModal from "./VerificationModal";
import Image from 'next/image';

const url = "https://theaudiobox-backend.onrender.com";

const Navbar2 = () => {

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const url = "https://theaudiobox-backend.onrender.com";


	const JoinWaitlist = () => {
		setIsModalOpen(true);
	};

	const verifyEmail = async () => {
		setLoading(true);
		try {
			const response = await axios.post(`${url}/waitlist/join`, { email });
			toast.success(response.data.message || "Your email has been Added!");
		} catch (error: any) {
			toast.error(
				error?.response.data.message ||
				"There was an error joining the waitlist. Please try again.",
			);
		} finally {
			setLoading(false);
		}
	};
	// const { address, isConnected } = useAccount();
	// const { signMessageAsync } = useSignMessage();

	// const [token, setToken] = useState(null);
	// const [message, setMessage] = useState(null);

	// useEffect(() => {
	// 	if (isConnected) {
	// 		signMessage();
	// 	}
	// }, [isConnected, token]);

	// const signMessage = async () => {
	// 	if (!isConnected) return alert("Please connect your wallet first");

	// 	const messageToSign: any = `Welcome to AudioBlocks! Sign this message to verify your wallet and unlock a world of decentralized music. Timestamp: ${new Date().toISOString()}`;

	// 	setMessage(messageToSign);

	// 	try {
	// 		const signature = await signMessageAsync({ message: messageToSign });
	// 		authenticateUser(address, signature, messageToSign, "user");
	// 	} catch (error) {
	// 		console.error("Message signing failed:", error);
	// 		toast.error("Message signing failed");
	// 	}
	// };

	// const authenticateUser = async (
	// 	address: any,
	// 	signature: any,
	// 	message: any,
	// 	role: any,
	// ) => {
	// 	try {
	// 		const response = await axios.post(`${url}/wallet/auth/verify_signature`, {
	// 			address: address,
	// 			signature: signature,
	// 			message: message,
	// 			role: role,
	// 		});
	// 		setToken(response.data.token);
	// 		Cookies.set("audioblocks_jwt", response.data.token, { expires: 30 });
	// 		toast.success(response.data.message || "Authentication successful!");
	// 	} catch (error: any) {
	// 		toast.error(error.response.data.message || "Authentication failed!");
	// 		console.error("Authentication failed:", error);
	// 	}
	// };

	const [showModal, setShowModal] = useState(false);

	return (
		<>
			<nav className="items-center font-roboto w-11/12 m-auto text-white py-7 flex justify-between">
				<div className="space-x-10 flex items-center">
					<Link href="/" className="flex space-x-3 items-center">
						{/* <div className="bg-pink-500 rounded-full md:h-10 h-7 w-7 md:w-10"></div> */}
						<img src="/images/logo1.png" height={40} width={40} alt="logo" className="rounded-full" />
						<h1 className="md:text-2xl text-lg font-semibold text-pink-400">
							AudioBlocks
						</h1>
					</Link>
					</div>

				{/* Mobile Menu Button */}
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="md:hidden text-white focus:outline-none"
					aria-label="Toggle menu"
				>
					{isOpen ? '✖' : '☰'}
				</button>

				{/* Navigation Links */}
				<div
					className={`absolute md:static top-16 left-0 w-full md:w-auto bg-black md:bg-transparent flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 p-4 md:p-0 ${isOpen ? 'block' : 'hidden md:flex'
						} md:ml-auto`}
				>
					{/* Join Waitlist Button */}
					<button
						className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-6 rounded-full shadow-md hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
						onClick={JoinWaitlist}
					>
						Join Waitlist
					</button>

					{/* Connect Button */}
					<div>
						<ConnectBtn />
					</div>
				</div>
			</nav>

			{/* Email Verification Modal */}
			<EmailVerificationModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onVerify={verifyEmail}
				loading={loading}
				email={email}
				setEmail={setEmail}
			/>
	</>
	);
};

export default Navbar2;