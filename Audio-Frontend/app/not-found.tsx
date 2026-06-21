'use client';

import Navbar from '@/layouts/navbar';
import Image from 'next/image';
// import Link from 'next/link';

const NotFound = () => {
  return (
    <>
      <Navbar />
      <div className="flex  flex-col -mt-20 max-w-xl h-screen m-auto bg-contain bg-no-repeat bg-center items-center justify-center min-h-screen bg-black text-[#A3A3A3] overflow-hidden">

        <div className="z-10 relative text-center px-4">
        <div className="absolute -z-10 -left-10 md:left-4 -top-10 bg-[#490D3E80] rounded-full w-70 md:w-100 h-100 blur-[100px]" />
          {/* Logo */}
          <Image
            src="/logo2.png" // Replace with your logo path
            alt="AudioBlocks Logo"
            width={150}
            height={150}
            className="mx-auto mb-1"
          />

          <h1 className="text-2xl text-[#F4F4F5] md:text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="max-w-xs mx-auto text-xs md:text-sm">
            The page you&lsquo;re looking for can&lsquo;t be found. Double-check the URL and try again
          </p>
        </div>
      </div>
    </>
  );
};
export default NotFound;
