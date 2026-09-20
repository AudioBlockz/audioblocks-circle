'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { toast } from 'sonner';
import { usePrivy } from '@privy-io/react-auth';
import { Auth } from '@/hooks/useAuth';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

// Must match AudioBlock_Backend/src/entities/Song.ts's SongMood enum.
const MOODS = ['happy', 'sad', 'energetic', 'chill', 'romantic', 'angry', 'nostalgic', 'focused'] as const;

interface OwnSong {
  id: string;
  title: string;
}

type Mode = 'new' | 'existing';
type UploadStage = 'idle' | 'uploading-audio' | 'uploading-cover' | 'finalizing' | 'creating-room' | 'done';

// Defaults a new room's window to "starts now, runs a week" — the artist
// can change either, this just avoids hitting submit with an empty (and
// therefore rejected, per CreateRoomDTO) date field.
const toLocalInputValue = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CreateRoom = () => {
  const { getAccessToken } = usePrivy();
  const { profile } = Auth();

  const [mode, setMode] = useState<Mode>('new');

  // "Use an existing track" mode
  const [songs, setSongs] = useState<OwnSong[]>([]);
  const [songId, setSongId] = useState('');

  // "Upload a new track" mode — same fields SongUpload.tsx collects, since
  // this finalizes through the exact same endpoint, just with
  // unreleased: true so the track is never public even momentarily.
  const [trackTitle, setTrackTitle] = useState('');
  const [trackDescription, setTrackDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [moods, setMoods] = useState<string[]>([]);
  const [composers, setComposers] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Room fields — shared by both modes.
  const [roomTitle, setRoomTitle] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [price, setPrice] = useState('');
  const [accessStartsAt, setAccessStartsAt] = useState(() => toLocalInputValue(new Date()));
  const [accessEndsAt, setAccessEndsAt] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  const [stage, setStage] = useState<UploadStage>('idle');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const submitting = stage !== 'idle' && stage !== 'done';

  const url = process.env.NEXT_PUBLIC_API_URL;

  // Only "ready" tracks not already attached to another room show up here —
  // GET /api/song already excludes unreleased ones, which is exactly what a
  // song becomes the moment it's turned into a room (see RoomService.createRoom).
  useEffect(() => {
    if (!profile || mode !== 'existing') return;
    (async () => {
      try {
        const res = await axios.get(`${url}/api/song`, { params: { artistId: profile.id } });
        setSongs((res.data?.data ?? []).map((s: any) => ({ id: s.id, title: s.title })));
      } catch {
        setSongs([]);
      }
    })();
  }, [profile?.id, mode, url]);

  const toggleMood = (m: string) => {
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const resetRoomFields = () => {
    setRoomTitle('');
    setRoomDescription('');
    setPrice('');
    setAccessStartsAt(toLocalInputValue(new Date()));
    setAccessEndsAt(toLocalInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
  };

  const resetNewTrackFields = () => {
    setTrackTitle('');
    setTrackDescription('');
    setGenre('');
    setMoods([]);
    setComposers('');
    setAudioFile(null);
    setCoverFile(null);
    setAudioProgress(0);
  };

  // Creates the Room itself — shared by both modes once a songId exists.
  const createRoom = async (accessToken: string | null, targetSongId: string) => {
    const res = await axios.post(
      `${url}/api/rooms`,
      {
        songId: targetSongId,
        title: roomTitle,
        description: roomDescription || undefined,
        price,
        accessStartsAt: new Date(accessStartsAt).toISOString(),
        accessEndsAt: new Date(accessEndsAt).toISOString(),
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.data?.data?.id as string;
  };

  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!songId || !roomTitle || !price) {
      toast.error('Pick a track, a room title, and a price');
      return;
    }

    setStage('creating-room');
    try {
      const accessToken = await getAccessToken();
      const roomId = await createRoom(accessToken, songId);
      toast.success("Room created — it's live on the marketplace now.");
      setCreatedRoomId(roomId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
      setSongId('');
      resetRoomFields();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create room');
    } finally {
      setStage('idle');
    }
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!audioFile) {
      toast.error('Choose an audio file to upload');
      return;
    }
    if (!coverFile) {
      toast.error('Choose a cover image');
      return;
    }
    if (!trackTitle || !trackDescription || !genre || moods.length === 0) {
      toast.error('Track title, description, genre, and at least one mood are required');
      return;
    }
    if (!roomTitle || !price) {
      toast.error('Give the room a title and a price');
      return;
    }

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

        await axios.post(`${url}/api/song/upload/chunk`, chunkForm, { headers: authHeader });
        setAudioProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      // 2. Upload the cover image.
      setStage('uploading-cover');
      const coverForm = new FormData();
      coverForm.append('fileId', fileId);
      coverForm.append('cover', coverFile);
      const coverRes = await axios.post(`${url}/api/song/upload/cover`, coverForm, { headers: authHeader });
      const coverArtPath = coverRes.data?.data?.cover;

      // 3. Finalize with unreleased: true — the track is hidden from the
      // public catalogue from the moment it's created, never briefly public
      // the way uploading normally and converting to a room afterwards
      // would leave it.
      setStage('finalizing');
      const finalizeRes = await axios.post(
        `${url}/api/song/upload/finalize`,
        {
          fileId,
          totalChunks,
          title: trackTitle,
          description: trackDescription,
          genre,
          mood: moods,
          coverArtPath,
          composers,
          unreleased: true,
        },
        { headers: authHeader }
      );
      const newSongId = finalizeRes.data?.data?.id as string;

      // 4. Create the room pointing at it. The track is still transcoding
      // at this point (RoomService.createRoom allows that) — it'll be
      // streamable once processing finishes, same as any other upload.
      setStage('creating-room');
      const roomId = await createRoom(accessToken, newSongId);

      setStage('done');
      toast.success("Room created — the track is processing and will be streamable to ticket holders shortly.");
      setCreatedRoomId(roomId);
      resetNewTrackFields();
      resetRoomFields();
      setStage('idle');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not create room');
      setStage('idle');
    }
  };

  const stageLabel: Record<UploadStage, string> = {
    idle: 'Open Room',
    'uploading-audio': `Uploading audio… ${audioProgress}%`,
    'uploading-cover': 'Uploading cover…',
    finalizing: 'Finalizing track…',
    'creating-room': 'Creating room…',
    done: 'Done',
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-white">
      <h1 className="font-['Poppins'] font-semibold text-[36px] mb-2">Open a Listening Room</h1>
      <p className="text-[#A3A3A3] mb-8">
        Upload a brand-new unreleased track, or reuse one already sitting in your catalogue. Set a
        price and an access window — only fans who buy a ticket ever see or hear it.
      </p>

      {createdRoomId && (
        <div className="mb-8 bg-[#1A1A1A] border border-[#D2045B]/40 rounded-lg px-4 py-3 text-sm">
          Room created —{' '}
          <Link href={`/marketPlace/${createdRoomId}`} className="text-[#D2045B] hover:underline">
            view it on the marketplace
          </Link>
          .
        </div>
      )}

      <div className="flex gap-2 mb-8">
        <button
          type="button"
          onClick={() => setMode('new')}
          className={`text-sm px-4 py-2 rounded-full cursor-pointer transition ${
            mode === 'new' ? 'bg-[#D2045B] text-white' : 'bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#242424]'
          }`}
        >
          Upload a new track
        </button>
        <button
          type="button"
          onClick={() => setMode('existing')}
          className={`text-sm px-4 py-2 rounded-full cursor-pointer transition ${
            mode === 'existing' ? 'bg-[#D2045B] text-white' : 'bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#242424]'
          }`}
        >
          Use an already-uploaded track
        </button>
      </div>

      {mode === 'existing' ? (
        songs.length === 0 ? (
          <p className="text-[#A3A3A3] text-sm">
            No eligible tracks — only already-uploaded, ready tracks not yet attached to a room can
            be turned into one. Use "Upload a new track" instead.
          </p>
        ) : (
          <form onSubmit={handleSubmitExisting} className="max-w-2xl space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium">Track</label>
              <select
                value={songId}
                onChange={(e) => setSongId(e.target.value)}
                className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none"
              >
                <option value="">Choose an uploaded track…</option>
                {songs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <RoomFields
              roomTitle={roomTitle}
              setRoomTitle={setRoomTitle}
              roomDescription={roomDescription}
              setRoomDescription={setRoomDescription}
              price={price}
              setPrice={setPrice}
              accessStartsAt={accessStartsAt}
              setAccessStartsAt={setAccessStartsAt}
              accessEndsAt={accessEndsAt}
              setAccessEndsAt={setAccessEndsAt}
            />

            <button
              type="submit"
              disabled={submitting}
              className="bg-pink-600 text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50 cursor-pointer"
            >
              {stageLabel[stage]}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleSubmitNew} className="max-w-2xl space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Track title</label>
            <input
              type="text"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              placeholder="Song title"
              className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Track description</label>
            <input
              type="text"
              value={trackDescription}
              onChange={(e) => setTrackDescription(e.target.value)}
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
                      selected ? 'bg-[#D2045B] text-white' : 'bg-[#1A1A1A] text-[#A3A3A3] hover:bg-[#242424]'
                    }`}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

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
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#A3A3A3] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-600 file:text-white file:text-sm file:font-semibold hover:file:bg-pink-700 cursor-pointer"
            />
            {audioFile && (
              <p className="mt-1 text-xs text-[#4B4B4B]">
                {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Cover art</label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-[#A3A3A3] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#242424] file:text-white file:text-sm file:font-semibold hover:file:bg-[#2E2E2E] cursor-pointer"
            />
            {coverFile && <p className="mt-1 text-xs text-[#4B4B4B]">{coverFile.name}</p>}
          </div>

          <div className="border-t border-[#242424] pt-6">
            <p className="text-sm font-semibold mb-4">Room details</p>
            <RoomFields
              roomTitle={roomTitle}
              setRoomTitle={setRoomTitle}
              roomDescription={roomDescription}
              setRoomDescription={setRoomDescription}
              price={price}
              setPrice={setPrice}
              accessStartsAt={accessStartsAt}
              setAccessStartsAt={setAccessStartsAt}
              accessEndsAt={accessEndsAt}
              setAccessEndsAt={setAccessEndsAt}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-pink-600 text-white px-6 py-2 rounded-md font-semibold disabled:opacity-50 cursor-pointer"
          >
            {stageLabel[stage]}
          </button>
        </form>
      )}
    </section>
  );
};

interface RoomFieldsProps {
  roomTitle: string;
  setRoomTitle: (v: string) => void;
  roomDescription: string;
  setRoomDescription: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  accessStartsAt: string;
  setAccessStartsAt: (v: string) => void;
  accessEndsAt: string;
  setAccessEndsAt: (v: string) => void;
}

// Shared by both upload modes — the room-level fields (price, window,
// marketing copy) are identical regardless of where the songId came from.
function RoomFields({
  roomTitle,
  setRoomTitle,
  roomDescription,
  setRoomDescription,
  price,
  setPrice,
  accessStartsAt,
  setAccessStartsAt,
  accessEndsAt,
  setAccessEndsAt,
}: RoomFieldsProps) {
  return (
    <>
      <div>
        <label className="block mb-2 text-sm font-medium">Room title</label>
        <input
          type="text"
          value={roomTitle}
          onChange={(e) => setRoomTitle(e.target.value)}
          placeholder="e.g. First listen: the new EP"
          className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Room description (optional)</label>
        <textarea
          value={roomDescription}
          onChange={(e) => setRoomDescription(e.target.value)}
          rows={3}
          placeholder="Tell fans what to expect"
          className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">Price (USDC)</label>
        <input
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="5"
          className="w-40 bg-[#1A1A1A] text-white rounded-lg px-4 py-2 placeholder:text-sm placeholder:text-[#4B4B4B] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium">Access opens</label>
          <input
            type="datetime-local"
            value={accessStartsAt}
            onChange={(e) => setAccessStartsAt(e.target.value)}
            className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">Access closes</label>
          <input
            type="datetime-local"
            value={accessEndsAt}
            onChange={(e) => setAccessEndsAt(e.target.value)}
            className="w-full bg-[#1A1A1A] text-white rounded-lg px-4 py-2 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}

export default CreateRoom;
