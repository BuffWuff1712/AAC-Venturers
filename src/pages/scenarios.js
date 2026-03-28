import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

const ScenariosPage = () => {
    const router = useRouter();
    // Mock data for the XP bar
    const currentXP = 450;
    const maxXP = 1000;
    const progress = (currentXP / maxXP) * 100;

    return (
        <div className="flex min-h-screen flex-col items-center bg-page-peach p-6 font-fredoka">

            {/* 3. The Back Button */}
            <button
                onClick={() => router.push("/")}
                className="absolute top-6 left-6 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-black text-text-brown shadow-[0_4px_0_#e5e7eb] hover:shadow-none hover:translate-y-[4px] active:scale-95 transition-all"
            >
                <span className="text-2xl">←</span> Back
            </button>

            {/* 1. Game-like XP Bar */}
            <div className="w-full max-w-2xl bg-white rounded-full p-2 shadow-md border-4 border-white mb-10 relative">
                <div
                    className="h-8 bg-child-green rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                >
                    {/* Shine effect on the bar */}
                    <div className="w-full h-2 bg-white/30 rounded-full mt-1 ml-2 mr-2"></div>
                </div>
                <span className="absolute inset-0 flex items-center justify-center font-black text-text-brown">
                    XP: {currentXP} / {maxXP}
                </span>
            </div>

            {/* 2. Title */}
            <h1 className="text-6xl font-black text-text-brown mb-12 drop-shadow-sm">
                Scenarios
            </h1>

            {/* 3. Scenario Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">

                {/* Scenario Card: Canteen */}
                <div className="group relative bg-white rounded-[40px] p-6 shadow-xl border-b-8 border-gray-200 hover:border-child-green transition-all hover:-translate-y-2">

                    {/* XP Badge at top right */}
                    <div className="absolute -top-4 -right-4 bg-yellow-400 text-text-brown font-black px-4 py-2 rounded-2xl shadow-lg border-4 border-white rotate-12 group-hover:rotate-0 transition-transform">
                        +50 XP
                    </div>

                    {/* Picture of Canteen */}
                    <div className="relative h-48 w-full rounded-[30px] overflow-hidden mb-6 bg-page-peach">
                        <Image
                            src="/images/canteen.jpg" // Ensure you add this image to public/images/
                            alt="Canteen"
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Card Content */}
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-text-brown mb-2">Canteen</h2>
                        <p className="text-lg font-medium text-gray-600 mb-6 leading-tight">
                            Learn how to order your favorite noodles and find a seat!
                        </p>

                        {/* Transition Button */}
                        <button
                            className="w-full bg-child-green hover:bg-green-400 text-text-brown font-black py-4 rounded-2xl text-2xl shadow-[0_6px_0_rgb(163,213,106)] active:shadow-none active:translate-y-[6px] transition-all"
                            onClick={() => console.log("Navigating to canteen...")}
                        >
                            Start Adventure
                        </button>
                    </div>
                </div>

                {/* You can add more cards here later by copying the div above */}
            </div>
        </div>
    );
};

export default ScenariosPage;