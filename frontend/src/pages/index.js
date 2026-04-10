// src/pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import ProfileButton from "@/components/ProfileButton";

const Home = () => {
  const router = useRouter();

  // Modal & Input States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // // ── MOCK CAREGIVER LOGIN ──────────────────────────────────────────
  // const handleCaregiverLogin = (e) => {
  //   e.preventDefault();
  //   setError("");

  //   // Matches the credentials your team requested
  //   if (email === "teacher@example.com" && password === "demo123") {
  //     // Simulate saving a session token
  //     localStorage.setItem("token", "demo-session-token");
  //     localStorage.setItem("userRole", "caregiver");

  //     setIsModalOpen(false);
  //     setSuccessMessage("Access Granted!");
  //   } else {
  //     setError("Invalid email or password. Hint: teacher@example.com / demo123");
  //   }
  // };

  // ── CAREGIVER LOGIN ──────────────────────────────────────────
  const handleCaregiverLogin = async (e) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "caregiver",
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // API returned error (e.g. wrong credentials)
      throw new Error(data.message || "Login failed");
    }

    // ✅ Save session data from API response
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("userId", data.user.userId);
    localStorage.setItem("caregiverId", data.user.caregiverId);

    setIsModalOpen(false);
    setSuccessMessage("Access Granted!");

  } catch (err) {
    setError(err.message || "Something went wrong. Please try again.");
  }
};

  // // ── MOCK CHILD LOGIN ──────────────────────────────────────────────
  // const handleChildClick = () => {
  //   // Simulate child session
  //   localStorage.setItem("token", "demo-session-token");
  //   localStorage.setItem("userRole", "child");
  //   setSuccessMessage("Welcome AAC-Venturer!");
  // };

  // ── CHILD LOGIN ──────────────────────────────────────────
  const handleChildClick = async (e) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "child",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // API returned error (e.g. wrong credentials)
      throw new Error(data.message || "Login failed");
    }

    // ✅ Save session data from API response
    localStorage.setItem("token", data.token);
    localStorage.setItem("userRole", data.user.role);
    localStorage.setItem("userId", data.user.userId);
    localStorage.setItem("caregiverId", data.user.childId);

    setIsModalOpen(false);
    setSuccessMessage("Welcome AAC-Venturer!");

  } catch (err) {
    setError(err.message || "Something went wrong. Please try again.");
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-peach p-4 font-fredoka">
      <div className="w-full max-w-4xl rounded-[60px] bg-[#FFF2E9] p-12 text-center shadow-xl md:p-20 relative overflow-hidden">

        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <Image src="/images/logo.png" alt="Logo" width={450} height={200} className="h-auto w-full max-w-md" />
        </div>

        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-2 text-text-brown">Welcome!</h1>
          <p className="text-3xl font-semibold opacity-80 text-text-brown">Select Profile</p>
        </div>

        {/* Profile Selection */}
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
            onClick={() => setIsModalOpen(true)}
          />
        </div>

        {/* --- CAREGIVER LOGIN MODAL --- */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-[40px] bg-white p-10 shadow-2xl animate-in zoom-in duration-200">
              <h2 className="text-3xl font-bold mb-6 text-text-brown text-center">Caregiver Login</h2>

              <form onSubmit={handleCaregiverLogin} className="flex flex-col gap-4">
                {error && <div className="text-red-500 font-bold bg-red-50 p-3 rounded-2xl text-sm border-2 border-red-100">{error}</div>}

                <input
                  type="email"
                  placeholder="Email Address"
                  className="rounded-2xl border-4 border-caregiver-peach/20 p-4 text-lg focus:border-caregiver-peach focus:outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="rounded-2xl border-4 border-caregiver-peach/20 p-4 text-lg focus:border-caregiver-peach focus:outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="rounded-2xl bg-caregiver-peach mt-2 p-5 text-2xl font-black text-text-brown hover:brightness-95 shadow-[0_6px_0_#e6b181] active:shadow-none active:translate-y-1 transition-all"
                >
                  Unlock
                </button>

                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setError(""); }}
                  className="text-lg font-bold text-gray-400 hover:text-text-brown mt-2"
                >
                  ← Not a Caregiver? Go back
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- SUCCESS MODAL --- */}
        {successMessage && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-[60px] bg-white p-12 shadow-2xl text-center border-8 border-child-green animate-in fade-in zoom-in duration-300">
              <div className="text-7xl mb-4">🌟</div>
              <h2 className="text-4xl font-black text-text-brown mb-8">{successMessage}</h2>

              <button
                onClick={() => {
                  if (successMessage.includes("Venturer")) router.push("/scenarios");
                  else router.push("/ManageScenario");
                }}
                className="w-full rounded-3xl bg-child-green p-6 text-3xl font-black text-text-brown hover:brightness-95 shadow-[0_8px_0_#92c45e] active:shadow-none active:translate-y-2 transition-all"
              >
                Let&apos;s Go!
              </button>

              {/* New "Go Back" Button */}
              <button
                onClick={() => setSuccessMessage("")}
                className="text-lg font-bold text-gray-400 hover:text-text-brown transition-colors mt-2"
              >
                ← Wrong profile? Go back
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;