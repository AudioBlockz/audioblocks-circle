'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import axios from 'axios';
import { toast } from 'sonner';
import { Auth } from '@/hooks/useAuth';

const EditProfile = () => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [twitter, setTwitter] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { profile, setProfile } = Auth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Prefill from whatever's already saved, once the profile has loaded —
  // guarded by profile.id so this only runs when a profile first becomes
  // available, not on every re-render while the user is mid-edit.
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.username || profile.name || '');
    setBio(profile.bio || '');
    setWebsite(profile.website || '');
    setCoverPreview(profile.pageCover || null);
    setAvatarPreview(profile.profileImage || null);
  }, [profile?.id]);

  const handleBackClick = () => {
    router.push('/dashboard/profile');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const url = process.env.NEXT_PUBLIC_API_URL;

    try {
      setSaving(true);
      const accessToken = await getAccessToken();

      const formData = new FormData();
      if (displayName) formData.append('username', displayName);
      if (bio) formData.append('bio', bio);
      if (website) formData.append('website', website);
      if (coverFile) formData.append('pageCover', coverFile);
      if (avatarFile) formData.append('profileImage', avatarFile);

      const response = await axios.patch(
        `${url}/api/artist/update-profile`,
        formData,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data?.data) {
        setProfile(response.data.data);
      }
      toast.success(response.data?.message || 'Profile updated');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
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
            <p className="mt-1 text-xs text-[#4B4B4B]">
              Connect X from your profile page — this field isn&apos;t saved yet.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-pink-600 text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>

        <div className="max-w-xs space-y-6">
          {/* Avatar Card with Upload */}
          <div className="bg-[#1A1A1A] rounded-xl shadow-md p-3 flex flex-col items-start">
            <Image
              src={avatarPreview || '/dashboard/profiledefault.png'}
              alt="Profile picture"
              width={96}
              height={96}
              className="rounded-full mb-4 object-cover w-24 h-24"
            />
            <h3 className="font-semibold text-lg mb-1">Photo</h3>
            <p className="text-sm font-medium text-gray-400 text-left mb-4">
              This is the picture listeners see on your public artist profile
            </p>

            <button
              type="button"
              onClick={handleAvatarClick}
              className="border cursor-pointer font-semibold border-white w-full rounded-md px-4 py-2 text-sm hover:bg-white hover:text-black transition"
            >
              Change Photo
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Cover Card with Upload */}
          <div className="bg-[#1A1A1A] rounded-xl shadow-md p-3 flex flex-col">
            <Image
              src={coverPreview || '/dashboard/profiledefault.png'}
              alt="Page cover"
              width={300}
              height={200}
              className="rounded-lg mb-4 object-cover w-full h-40"
            />
            <h3 className="font-semibold text-lg mb-1">Cover</h3>
            <p className="text-sm font-medium text-gray-400 text-left mb-4">
              Make your artist profile stand out with a striking cover image
            </p>

            <button
              type="button"
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
    </div>
  );
};

export default EditProfile;
