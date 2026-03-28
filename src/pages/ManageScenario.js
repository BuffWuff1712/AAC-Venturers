import Image from "next/image";
import { useRouter } from "next/router";

// Rename the function here
const ManageScenario = () => {
    const router = useRouter();

    const scenarios = [
        { id: 1, title: "Canteen", image: "/images/canteen.jpg", description: "Practice ordering noodles and finding seats." },
    ];

    return (
        <div className="flex min-h-screen flex-col items-center bg-page-peach p-6 font-fredoka relative">

            {/* Logout Button */}
            <button
                onClick={() => router.push("/")}
                className="absolute top-6 left-6 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-black text-text-brown shadow-[0_4px_0_#e5e7eb] hover:shadow-none hover:translate-y-[4px] active:scale-95 transition-all"
            >
                <span className="text-2xl">←</span> Logout
            </button>

            {/* Page Title */}
            <div className="text-center mt-12 mb-12">
                <h1 className="text-6xl font-black text-text-brown mb-2 drop-shadow-sm">
                    Manage Scenarios
                </h1>
                <p className="text-2xl font-bold opacity-70 text-text-brown">Edit and Track Progress</p>
            </div>

            {/* Grid ... (keep the grid code from before) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {scenarios.map((scenario) => (
                    <div key={scenario.id} className="bg-white rounded-[40px] p-6 shadow-xl border-b-8 border-gray-200">
                        <div className="relative h-40 w-full rounded-[30px] overflow-hidden mb-6 bg-page-peach">
                            <Image src={scenario.image} alt={scenario.title} fill className="object-cover" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-text-brown mb-4">{scenario.title}</h2>
                            <div className="flex flex-col gap-3">
                                <button className="flex items-center justify-center gap-2 w-full bg-caregiver-peach hover:bg-[#ffc891] text-text-brown font-black py-4 rounded-2xl text-xl shadow-[0_5px_0_#e6b181] active:shadow-none active:translate-y-[5px] transition-all">
                                    <span>✏️</span> Edit Scenario
                                </button>
                                <button className="flex items-center justify-center gap-2 w-full bg-child-green hover:bg-[#b9e67a] text-text-brown font-black py-4 rounded-2xl text-xl shadow-[0_5px_0_#92c45e] active:shadow-none active:translate-y-[5px] transition-all">
                                    <span>🕒</span> View History
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Update the export here
export default ManageScenario;