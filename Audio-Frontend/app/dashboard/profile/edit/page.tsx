'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const EditProfile = () => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackClick = () => {
    router.push('/dashboard/profile');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCoverClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen">
      <div className="mb-4">
        <button
          onClick={handleBackClick}
          className="bg-pink-600 cursor-pointer font-semibold text-xs px-4 py-3 rounded-lg"
        >
          Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-30">
        <form className="lg:col-span-2 space-y-6">
          <div>
            <label className="block mb-2 text-base font-medium">Display name</label>
            <input
              type="text"
              placeholder="Add Display name"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-base font-medium">Short bio</label>
            <input
              type="text"
              placeholder="Tell about yourself in a few words"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-base font-medium">Website URL</label>
            <input
              type="url"
              placeholder="https://"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-base font-medium">X (Twitter)</label>
            <input
              type="text"
              placeholder="Enter your X username"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="bg-pink-600 text-white px-6 py-2 rounded-md font-semibold"
          >
            Save
          </button>
        </form>

        {/* Profile Card with Upload */}
        <div className="bg-[#1A1A1A] h-85 rounded-xl shadow-md p-3 flex flex-col max-w-xs">
          <Image
            src={coverImage || '/dashboard/profiledefault.png'}
            alt="User Profile"
            width={300}
            height={200}
            className="rounded-lg mb-4 object-cover w-full h-40"
          />
          <h3 className="font-semibold text-lg mb-1">Profile</h3>
          <p className="text-sm font-medium text-gray-400 text-left mb-4">
            Make your artist profile stand out with a striking cover image
          </p>

          <button
            onClick={handleAddCoverClick}
            className="border cursor-pointer font-semibold border-white w-full rounded-md px-4 py-2 text-sm hover:bg-white hover:text-black transition"
          >
            Add Cover
          </button>

         
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
