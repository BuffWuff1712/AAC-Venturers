import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import ProfileButton from "@/components/ProfileButton";
import { api, saveAuthSession } from "@/api/client";

const Home = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [childName, setChildName] = useState("");

  const handleCaregiverLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = await api.login({
        role: "caregiver",
        email,
        password,
      });

      saveAuthSession(payload);
      setIsModalOpen(false);
      setSuccessMessage("Access Granted!");
    } catch (err) {
      setError(err.message || "Unable to log in right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChildClick = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      const payload = await api.login({ role: "child" });
      saveAuthSession(payload);
      setSuccessMessage("Welcome AAC-Venturer!");
    } catch (err) {
      setError(err.message || "Unable to start child session right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page-peach p-4 font-fredoka">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[60px] bg-[#FFF2E9] p-12 text-center shadow-xl md:p-20">
        <div className="mb-8 flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={450}
            height={200}
            className="h-auto w-full max-w-md"
          />
        </div>

        <div className="mb-12">
          <h1 className="mb-2 text-6xl font-bold text-text-brown">Welcome!</h1>
          <p className="text-3xl font-semibold text-text-brown opacity-80">
            Select Profile
          </p>
        </div>

        {error && !isModalOpen ? (
          <div className="mx-auto mb-8 max-w-xl rounded-3xl border-2 border-red-100 bg-white p-4 text-center text-lg font-bold text-red-500">
            {error}
          </div>
        ) : null}

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
            onClick={() => {
              setError("");
              setIsModalOpen(true);
            }}
          />
        </div>

        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm animate-in zoom-in rounded-[40px] bg-white p-10 shadow-2xl duration-200">
              <h2 className="mb-6 text-center text-3xl font-bold text-text-brown">
                Caregiver Login
              </h2>

              <form onSubmit={handleCaregiverLogin} className="flex flex-col gap-4">
                {error ? (
                  <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-3 text-sm font-bold text-red-500">
                    {error}
                  </div>
                ) : null}

                <input
                  type="email"
                  placeholder="Email Address"
                  className="rounded-2xl border-4 border-caregiver-peach/20 p-4 text-lg transition-all focus:border-caregiver-peach focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="Password"
                  className="rounded-2xl border-4 border-caregiver-peach/20 p-4 text-lg transition-all focus:border-caregiver-peach focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 rounded-2xl bg-caregiver-peach p-5 text-2xl font-black text-text-brown shadow-[0_6px_0_#e6b181] transition-all hover:brightness-95 active:translate-y-1 active:shadow-none"
                >
                  {isSubmitting ? "Unlocking..." : "Unlock"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError("");
                  }}
                  className="mt-2 text-lg font-bold text-gray-400 hover:text-text-brown"
                >
                  ← Not a Caregiver? Go back
                </button>
              </form>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm animate-in fade-in zoom-in rounded-[60px] border-8 border-child-green bg-white p-12 text-center shadow-2xl duration-300">
              <div className="mb-4 text-7xl">🌟</div>
              <h2 className="mb-8 text-4xl font-black text-text-brown">
                {successMessage}
              </h2>

              {successMessage.includes("Venturer") ? (
                <div className="mb-6 text-left">
                  <label
                    htmlFor="child-name"
                    className="mb-3 block text-lg font-black text-text-brown"
                  >
                    What&apos;s your name?
                  </label>
                  <input
                    id="child-name"
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Type your name here"
                    className="w-full rounded-3xl border-4 border-child-green/40 bg-[#FFF9F5] px-5 py-4 text-xl font-bold text-text-brown outline-none transition-all focus:border-child-green"
                  />
                </div>
              ) : null}

              <button
                onClick={() => {
                  if (successMessage.includes("Venturer")) {
                    localStorage.setItem("childDisplayName", childName.trim());
                    router.push("/scenarios");
                    return;
                  }

                  router.push("/ManageScenario");
                }}
                className="w-full rounded-3xl bg-child-green p-6 text-3xl font-black text-text-brown shadow-[0_8px_0_#92c45e] transition-all hover:brightness-95 active:translate-y-2 active:shadow-none"
              >
                Let&apos;s Go!
              </button>

              <button
                onClick={() => setSuccessMessage("")}
                className="mt-2 text-lg font-bold text-gray-400 transition-colors hover:text-text-brown"
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
