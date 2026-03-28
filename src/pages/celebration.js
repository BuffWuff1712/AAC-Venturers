import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const CelebrationPage = () => {
    const router = useRouter();
    const [showContent, setShowContent] = useState(false);

    // Trigger the "Pop" effect when the page loads
    useEffect(() => {
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-page-peach p-6 font-fredoka overflow-hidden relative">

            {/*
             Background "Confetti" (Static Emojis for now)
            <div className="absolute inset-0 pointer-events-none">
                <span className="absolute top-10 left-10 text-4xl animate-bounce">🎉</span>
                <span className="absolute top-20 right-20 text-4xl animate-bounce delay-100">✨</span>
                <span className="absolute bottom-20 left-1/4 text-4xl animate-bounce delay-300">🌟</span>
                <span className="absolute top-1/2 right-10 text-4xl animate-bounce delay-500">🥳</span>
            </div>
            */}

            {/* Main Celebration Card */}
            <div className={`transition-all duration-700 transform ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} 
        bg-white rounded-[60px] p-12 shadow-2xl border-8 border-child-green text-center max-w-lg w-full relative z-10`}>

                {/* The Big Star / Icon */}
                <div className="relative mb-6">
                    <span className="text-9xl block animate-tada">⭐</span>
                    {/* XP Popup */}
                    <div className="absolute -top-4 -right-2 bg-yellow-400 text-text-brown font-black px-6 py-2 rounded-full text-3xl shadow-lg border-4 border-white animate-bounce">
                        +50 XP
                    </div>
                </div>

                {/* Success Message */}
                <h1 className="text-5xl font-black text-text-brown mb-4 leading-tight">
                    Well Done!
                </h1>
                <p className="text-2xl font-bold text-brown-500 mb-10">
                    Keep up the good work, <br /> AAC-Venturer!
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                    {/* Try Again Button */}
                    <button
                        onClick={() => alert("Heading back to the simulation...")}
                        className="w-full bg-caregiver-peach hover:bg-[#ffc891] text-text-brown font-black py-5 rounded-3xl text-2xl shadow-[0_6px_0_#e6b181] active:shadow-none active:translate-y-[6px] transition-all"
                    >
                        🔄 Try Again
                    </button>

                    {/* New Scenario Button */}
                    <button
                        onClick={() => router.push("/scenarios")}
                        className="w-full bg-child-green hover:bg-[#b9e67a] text-text-brown font-black py-5 rounded-3xl text-2xl shadow-[0_6px_0_#92c45e] active:shadow-none active:translate-y-[6px] transition-all"
                    >
                        🗺️ New Scenario
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CelebrationPage;