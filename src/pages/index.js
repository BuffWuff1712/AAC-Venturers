// src/pages/index.js
import Image from "next/image";
import ProfileButton from "@/components/ProfileButton";

const Home = () => {
  return (
    // Main background wrapper
    <div className="flex min-h-screen items-center justify-center bg-page-peach p-4">

      {/* The Rounded Card Container */}
      <div className="w-full max-w-4xl rounded-[60px] bg-[#FFF2E9] p-12 text-center shadow-xl md:p-20">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo.png"
            alt="AAC-Venturers!"
            width={550}
            height={300}
            className="h-auto w-full max-w-md"
          />
        </div>

        {/* Headings */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-2">Welcome!</h1>
          <p className="text-3xl font-semibold opacity-80">Select Profile</p>
        </div>

        {/* Profiles */}
        <div className="flex flex-col items-center justify-center gap-12 sm:flex-row sm:gap-24">
          <ProfileButton
            label="Child"
            avatarSrc="/images/child.png"
            bgColorClass="bg-child-green"
          />
          <ProfileButton
            label="Caregiver"
            avatarSrc="/images/caregiver.png"
            bgColorClass="bg-caregiver-peach"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;