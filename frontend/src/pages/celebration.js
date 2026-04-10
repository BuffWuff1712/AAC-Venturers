import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti"; // Import the confetti library

const CelebrationPage = () => {
    const router = useRouter();
    const [showContent, setShowContent] = useState(false);

    // Get the previous scenario from the URL query
    const { from, result } = router.query;

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);

            // 🎉 Trigger the confetti burst!
            fireCelebrationConfetti();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const fireCelebrationConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // Confetti from left and right
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const handleTryAgain = () => {
        // FIXED ROUTING: Because canteen.tsx is in /pages/scenario/
        if (from) {
            router.push(`/scenario/${from}`);
        } else {
            router.push("/scenarios");
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-page-peach p-6 font-fredoka overflow-hidden relative">

            <div className={`transition-all duration-700 transform ${showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} 
                bg-white rounded-[60px] p-12 shadow-2xl border-8 border-child-green text-center max-w-lg w-full relative z-50`}>

                <div className="relative mb-6">
                    <span className="text-9xl block animate-bounce">⭐</span>
                    <div className="absolute -top-4 -right-2 bg-yellow-400 text-text-brown font-black px-6 py-2 rounded-full text-3xl shadow-lg border-4 border-white">
                        +50 XP
                    </div>
                </div>

                <h1 className="text-5xl font-black text-text-brown mb-4 leading-tight">
                    Well Done!
                </h1>
                <p className="text-2xl font-bold text-brown-500 mb-10">
                    Keep up the good work, <br /> AAC-Venturer!
                </p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleTryAgain}
                        className="w-full bg-caregiver-peach hover:bg-[#ffc891] text-text-brown font-black py-5 rounded-3xl text-2xl shadow-[0_6px_0_#e6b181] active:shadow-none active:translate-y-[6px] transition-all"
                    >
                        🔄 Try Again
                    </button>

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