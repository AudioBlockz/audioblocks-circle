'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

type UploadStage = 'idle' | 'uploading-audio' | 'uploading-cover' | 'finalizing' | 'done';

// Must match AudioBlock_Backend/src/entities/Song.ts's SongMood enum.
const MOODS = ['happy', 'sad', 'energetic', 'chill', 'romantic', 'angry', 'nostalgic', 'focused'] as const;

interface ActiveCollab {
  id: string;
  title: string;
}

const SongUpload = () => {
  const { getAccessToken } = usePrivy();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [moods, setMoods] = useState<string[]>([]);
  const [composers, setComposers] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [stage, setStage] = useState<UploadStage>('idle');
  const [audioProgress, setAudioProgress] = useState(0);

  const [activeCollabs, setActiveCollabs] = useState<ActiveCollab[]>([]);
  const [collabId, setCollabId] = useState('');

  const toggleMood = (m: string) => {
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const uploading = stage !== 'idle' && stage !== 'done';

  // Only collabs that are past the invite/accept stage can receive songs —
  // see CollectionService.attachSong on the backend.
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    (async () => {
      try {
        const accessToken = await getAccessToken();
        const res = await axios.get(`${url}/api/collections/mine`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const collabs = (res.data?.data ?? []).filter((c: any) => c.status === 'active');
        setActiveCollabs(collabs.map((c: any) => ({ id: c.id, title: c.title })));
      } catch {
        setActiveCollabs([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGenre('');
    setMoods([]);
    setComposers('');
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreview(null);
    setAudioProgress(0);
    setCollabId('');
    setStage('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;

    if (!audioFile) {
      toast.error('Choose an audio file to upload');
      return;
    }
    if (!coverFile) {
      toast.error('Choose a cover image');
      return;
    }
    if (!title || !description || !genre || moods.length === 0) {
      toast.error('Title, description, genre, and at least one mood are required');
      return;
    }

    const url = process.env.NEXT_PUBLIC_API_URL;
    const fileId = crypto.randomUUID();

    try {
      const accessToken = await getAccessToken();
      const authHeader = { Authorization: `Bearer ${accessToken}` };

      // 1. Upload the audio file in chunks.
      setStage('uploading-audio');
      const totalChunks = Math.ceil(audioFile.size / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, audioFile.size);
        const chunkBlob = audioFile.slice(start, end, audioFile.type);

        const chunkForm = new FormData();
        chunkForm.append('fileId', fileId);
        chunkForm.append('chunkIndex', String(i));
        chunkForm.append('chunk', chunkBlob, `${fileId}-chunk-${i}`);

        await axios.post(`${url}/api/song/upload/chunk`, chunkForm, {
          headers: authHeader,
        });
        setAudioProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      // 2. Upload the cover image.
      setStage('uploading-cover');
      const coverForm = new FormData();
      coverForm.append('fileId', fileId);
      coverForm.append('cover', coverFile);
      const coverRes = await axios.post(`${url}/api/song/upload/cover`, coverForm, {
        headers: authHeader,
      });
      const coverArtPath = coverRes.data?.data?.cover;

      // 3. Finalize — merges the chunks, uploads to S3, and queues
      // transcoding + on-chain registration in the background.
      setStage('finalizing');
      const finalizeRes = await axios.post(
        `${url}/api/song/upload/finalize`,
        { fileId, totalChunks, title, description, genre, mood: moods, coverArtPath, composers },
        { headers: authHeader }
      );

      // 4. Optionally tag the new song into an active collab, so its
      // rewards split across the collab's members instead of paying this
      // artist alone. Best-effort — a failure here shouldn't undo the
      // upload that already succeeded.
      if (collabId) {
        const songId = finalizeRes.data?.data?.id;
        try {
          await axios.post(
            `${url}/api/collections/${collabId}/songs`,
            { songId },
            { headers: authHeader }
          );
        } catch (attachError: any) {
          toast.error(
            attachError?.response?.data?.message ||
              'Song uploaded, but attaching it to the collab failed — attach it manually later.'
          );
        }
      }

      setStage('done');
      toast.success('Song uploaded — it’s processing now and will appear once ready.');
      resetForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Upload failed');
      setStage('idle');
    }
  };

  const stageLabel: Record<UploadStage, string> = {
    idle: 'Upload Track',
    'uploading-audio': `Uploading audio… ${audioProgress}%`,
    'uploading-cover': 'Uploading cover…',
    finalizing: 'Finalizing…',
    done: 'Done',
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white">
      <h1 className="font-['Poppins'] font-semibold text-[36px] mb-2">Upload a Track</h1>
      <p className="text-[#A3A3A3] mb-10">
        Add your song, cover art, and details. It'll be processed and registered on-chain
        automatically once uploaded.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Genre</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Afrobeat, Hip-Hop"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const selected = moods.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMood(m)}
                    className={`text-xs px-3 py-1.5 rounded-full cursor-pointer transition ${
                      selected
                        ? 'bg-[#D2045B] text-white'
                        : 'bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#242424]'
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-[#4B4B4B]">
              Pick one or more — helps listeners find this song when browsing by how they feel.
            </p>
          </div>

          {activeCollabs.length > 0 && (
            <div>
              <label className="block mb-2 text-sm font-medium">Attach to a collab (optional)</label>
              <select
                value={collabId}
                onChange={(e) => setCollabId(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none"
              >
                <option value="">Just this artist (no collab)</option>
                {activeCollabs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[#4B4B4B]">
                Rewards for this song will split across the collab's members.
              </p>
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium">Composers (optional)</label>
            <input
              type="text"
              value={composers}
              onChange={(e) => setComposers(e.target.value)}
              placeholder="Names, comma separated"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Audio file</label>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="block w-full text-sm text-[#A3A3A3] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-600 file:text-white file:text-sm file:font-semibold hover:file:bg-pink-700 cursor-pointer"
            />
            {audioFile && (
              <p className="mt-1 text-xs text-[#4B4B4B]">
                {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-pink-600 text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50"
          >
            {stageLabel[stage]}
          </button>
        </form>

        {/* Cover art picker */}
        <div className="bg-[#1A1A1A] h-85 rounded-xl shadow-md p-3 flex flex-col max-w-xs">
          <Image
            src={coverPreview || '/dashboard/profiledefault.png'}
            alt="Cover art"
            width={300}
            height={200}
            className="rounded-lg mb-4 object-cover w-full h-40"
          />
          <h3 className="font-semibold text-lg mb-1">Cover Art</h3>
          <p className="text-sm font-medium text-gray-400 text-left mb-4">
            Square image works best.
          </p>

          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="border cursor-pointer font-semibold border-white w-full rounded-md px-4 py-2 text-sm hover:bg-white hover:text-black transition"
          >
            Choose Image
          </button>

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>
      </div>
    </section>
  );
};

export default SongUpload;
