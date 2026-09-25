'use client';

import { motion } from 'framer-motion';
import { SendHorizonal, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';

interface CommentPanelProps {
  onClose: () => void;
  songId: string;
}

interface ApiComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id?: string; name: string; profileImage: string | null };
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const Comment = ({ onClose, songId }: CommentPanelProps) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { authenticated, getAccessToken } = usePrivy();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    setLoading(true);
    axios
      .get(`${url}/api/song/${songId}/comments`)
      .then((res) => setComments(res.data?.data ?? []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [songId]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || posting) return;

    if (!authenticated) {
      toast.error('Log in to comment');
      return;
    }

    setPosting(true);
    try {
      const url = process.env.NEXT_PUBLIC_API_URL;
      const accessToken = await getAccessToken();
      const res = await axios.post(
        `${url}/api/song/${songId}/comments`,
        { content },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setComments((prev) => [res.data.data, ...prev]);
      setDraft('');
    } catch {
      toast.error('Could not post comment — try again');
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ y: 300, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      ref={menuRef}
      className="fixed bottom-0 pb-20 left-0 right-0 sm:left-auto bg-[#1e1e1e] w-full sm:w-80 sm:max-w-sm h-[90vh] p-4 z-50 flex flex-col"
    >
      <div className="flex items-center border-b pb-3 justify-between mb-4">
        <h2 className="text-[#A3A3A3] text-lg font-bold">Comments</h2>
        <button onClick={onClose} className="text-[#A3A3A3] cursor-pointer hover:text-red-400">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="animate-spin text-[#A3A3A3]" size={20} />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-[#A3A3A3] text-center pt-8">
            No comments yet — be the first to say something.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex flex-col border-b pb-2 items-start gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src={comment.user.profileImage || '/AFRO.jpg'}
                  alt={comment.user.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
                <h3 className="text-sm font-semibold text-white">{comment.user.name}</h3>
                <span className="text-xs font-normal text-[#AFB6B2]">
                  {formatTime(comment.createdAt)}
                </span>
              </div>

              <div>
                <p className="text-xs font-normal text-[#AFB6B2]">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center bg-[#2a2a2a] border rounded-md px-4 py-2 mt-4">
        <textarea
          name="comment"
          placeholder={authenticated ? 'Type here' : 'Log in to comment'}
          cols={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!authenticated || posting}
          className="w-full resize-none custom-scrollbar bg-transparent text-white outline-none disabled:opacity-50"
          id="comment"
        ></textarea>
        <button onClick={handleSend} disabled={!draft.trim() || posting} className="disabled:opacity-30">
          {posting ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <SendHorizonal className="cursor-pointer" size={18} />
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default Comment;
