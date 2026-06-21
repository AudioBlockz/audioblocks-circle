import React from 'react';

const EmailVerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  email,
  setEmail,
  loading,
}: any) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="flex fixed items-center justify-center inset-0 px-5 bg-black bg-opacity-50"
      >
        <div
          onClick={(e) => e.stopPropagation()} // Prevent event from propagating to the backdrop
          className="z-50 relative text-white bg-[#180413] p-6 rounded-lg max-w-md w-full"
        >
          <h2 className="text-xl text-center font-semibold mb-4">Verify Your Email</h2>
          <p className="mb-4">Please confirm your email to join the waitlist:</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@domain.com"
            className="w-full border bg-transparent outline-none border-gray-300 px-3 py-2 rounded-full mb-4"
          />
          <div className="grid gap-10">
            <button
              onClick={onVerify}
              className={`bg-[#B21985] text-white font-semibold px-6 py-2 rounded-full focus:outline-none hover:bg-pink-700 transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Loading...' : 'Verify Email'}
            </button>
            <button
              onClick={onClose}
              className="w-full hover:bg-[#B21985] text-white py-2 rounded font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailVerificationModal;
