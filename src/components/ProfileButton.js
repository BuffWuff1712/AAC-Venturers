// src/components/ProfileButton.js
import Image from "next/image";

const ProfileButton = ({ label, avatarSrc, bgColorClass, onClick }) => {
    return (
        <button
            onClick={onClick} // This allows the button to trigger functions
            className="flex flex-col items-center gap-6 transition-transform hover:scale-105 active:scale-95"
        >
            <div className={`relative h-48 w-48 rounded-full ${bgColorClass} flex items-center justify-center p-6 shadow-sm`}>
                <div className="relative h-full w-full">
                    <Image src={avatarSrc} alt={label} fill className="object-contain" />
                </div>
            </div>
            <span className="text-4xl font-bold tracking-tight text-text-brown">
                {label}
            </span>
        </button>
    );
};

export default ProfileButton;