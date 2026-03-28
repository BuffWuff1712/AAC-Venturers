// src/pages/index.js
import { useState } from "react";
import Image from "next/image";
import ProfileButton from "@/components/ProfileButton";

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(""); // State for success popups

  const handleCaregiverClick = () => {
    setIsModalOpen(true);
    setError("");
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === "1234") {
      setError("");
      setIsModalOpen(false); // Close login modal
      setSuccessMessage("Access Granted!"); // Show success popup
      setPassword("");
    } else {
      setError("Wrong password, try again!");
      setPassword("");
    }
  };

  const handleChildClick = () => {
    setSuccessMessage("Welcome AAC-Venturer!");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-peach p-4">
      <div className="w-full max-w-4xl rounded-[60px] bg-[#FFF2E9] p-12 text-center shadow-xl md:p-20 relative overflow-hidden">

        {/* Header Section */}
        <div className="flex justify-center mb-8">
          <Image src="/images/logo.png" alt="Logo" width={450} height={200} className="h-auto w-full max-w-md" />
        </div>
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-2 text-text-brown">Welcome!</h1>
          <p className="text-3xl font-semibold opacity-80 text-text-brown">Select Profile</p>
        </div>

        {/* Profiles */}
        <div className="flex flex-col items-center justify-center gap-12 sm:flex-row sm:gap-24">
          <ProfileButton
            label="Child"
            avatarSrc="/images/child.png"
            bgColorClass="bg-child-green"
            onClick={handleChildClick}
          />
          <ProfileButton
            label="Caregiver"
            avatarSrc="/images/caregiver.png"
            bgColorClass="bg-caregiver-peach"
            onClick={handleCaregiverClick}
          />
        </div>

        {/* --- PASSWORD LOGIN MODAL --- */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[40px] bg-white p-10 shadow-2xl scale-in-center">
              <h2 className="text-3xl font-bold mb-6 text-text-brown">Caregiver Login</h2>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                {error && <div className="text-red-500 font-bold bg-red-50 py-2 rounded-lg text-sm">{error}</div>}
                <input
                  type="password"
                  placeholder="Enter Password"
                  className={`rounded-2xl border-2 p-4 text-center text-xl focus:outline-none ${error ? 'border-red-400 bg-red-50' : 'border-caregiver-peach'}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                  autoFocus
                />
                <button type="submit" className="rounded-2xl bg-caregiver-peach p-4 text-2xl font-black text-text-brown hover:brightness-95 shadow-md">Unlock</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-lg font-bold text-gray-400 mt-2">Cancel</button>
              </form>
            </div>
          </div>
        )}

        {/* --- REUSABLE SUCCESS MODAL --- */}
        {successMessage && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[40px] bg-white p-12 shadow-2xl text-center border-4 border-child-green">
              {/* Animated checkmark or icon could go here */}
              <div className="text-6xl mb-4">🌟</div>
              <h2 className="text-4xl font-black text-text-brown mb-6">
                {successMessage}
              </h2>
              <button
                onClick={() => setSuccessMessage("")}
                className="w-full rounded-2xl bg-child-green p-4 text-2xl font-black text-text-brown hover:brightness-95 shadow-lg active:scale-95 transition-all"
              >
                Let's Go!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;