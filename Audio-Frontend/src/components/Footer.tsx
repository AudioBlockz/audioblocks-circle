import { Youtube, Instagram, Twitter, Facebook, Mail } from "lucide-react";
import Link from "next/link";
import React from "react";

const Footer = () => {
	return (
		<footer className="bg-custom-gradient font-roboto text-gray-400 py-12">
			<div className="w-11/12 mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="col-span-1 md:col-span-1 text-base">
					<div className="flex items-center space-x-3 mb-4">
						<img
							src="/images/logo1.png"
							alt="logo"
							className="rounded-full w-10 h-10"
						/>
						<h2 className="text-white font-semibold text-xl">AudioBlocks</h2>
					</div>
					<p className="text-sm">
						AudioBlocks is a music platform that empowers artists to retain
						ownership of their music and earn fair revenue. Fans can discover,
						stream, and support artists directly
					</p>
				</div>

				<div className="col-span-1 md:col-span-1 text-base md:py-0 py-4">
					<h3 className="text-[#5B5C61] font-semibold text-lg mb-4">
						Navigation
					</h3>
					<ul className="space-y-2">
						<li>
							<Link href="/dashboard" className="hover:text-white">
								Stream
							</Link>
						</li>
						<li>
							<Link href="/" className="hover:text-white">
								Marketplace
							</Link>
						</li>
						<li>
							<Link href="/" className="hover:text-white">
								Artist Hub
							</Link>
						</li>
					</ul>
				</div>

				<div className="col-span-1 md:col-span-1 text-base md:py-0 py-4">
					<h3 className="text-[#5B5C61] font-semibold text-lg mb-4">Support</h3>
					<ul className="space-y-2">
						<li>
							<Link href="/" className="hover:text-white">
								FAQ
							</Link>
						</li>
						<li>
							<Link href="/" className="hover:text-white">
								Contact
							</Link>
						</li>
						<li>
							<Link href="/" className="hover:text-white">
								Privacy Policy
							</Link>
						</li>
						<li>
							<Link href="/" className="hover:text-white">
								Terms of Service
							</Link>
						</li>
					</ul>
				</div>

				<div className="col-span-1 md:col-span-1 text-base md:py-0 py-4">
					<h3 className="text-[#5B5C61] font-semibold text-lg mb-4">
						Social Media
					</h3>
					<p className="mb-4">
						For recent updates and news follow our social media feeds
					</p>
					<div className="flex space-x-4">
						<Link
							href="https://www.youtube.com/@AudioBlocks102"
							className="hover:text-white"
						>
							<i className="fab fa-youtube"></i>
							<Youtube className="w-6 h-6" />
						</Link>
						<Link href="/" className="hover:text-white">
							<Instagram className="w-6 h-6" />
						</Link>
						<Link href="/" className="hover:text-white">
							<Facebook className="w-6 h-6" />
						</Link>
						<Link
							href="https://x.com/audioboxonchain?t=G8OG_rr_alJaFWEbzrKD2g&s=09"
							className="hover:text-white"
						>
							<Twitter className="w-6 h-6" />
						</Link>
						<Link href="" className="hover:text-white">
							<Mail className="w-6 h-6" />
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
