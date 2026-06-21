import { NextRequest, NextResponse } from "next/server";
import {toast} from "react-toastify";

const protectedRoutes = [
	"/dashboard",
	"/dashboard/album",
	"/dashboard/profile",
	"/dashboard/marketplace",
	"/dashboard/search",
	"/dashboard/wallet",
	"/dashboard/artist/[artistid]",
	"/dashboard/artist",
];

export default function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Check for authentication token in cookies
	const token = req.cookies.get("audioblocks_jwt");

	// If no token and trying to access protected route, redirect to home
	if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
		toast.error("Please login to access this page");
		return NextResponse.redirect(new URL("/", req.url));
	}

	// Allow request to proceed
	return NextResponse.next();
}

export const config = {
	matcher: protectedRoutes, // Matches all dashboard-related paths
};
