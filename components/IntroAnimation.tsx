import React, { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';

interface IntroAnimationProps {
    onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
    const [stage, setStage] = useState<'takeoff' | 'landing' | 'complete'>('takeoff');

    useEffect(() => {
        // Stage 1: Takeoff (0-2.5s)
        const timer1 = setTimeout(() => {
            setStage('landing');
        }, 2500);

        // Stage 2: Landing/Bangkok (2.5s-5s)
        const timer2 = setTimeout(() => {
            setStage('complete');
            // Small delay to allow fade out
            setTimeout(onComplete, 500);
        }, 5500);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    if (stage === 'complete') return null;

    return (
        <div className={`fixed inset-0 z-[100] bg-black transition-opacity duration-1000 overflow-hidden ${stage === 'landing' ? 'opacity-100' : 'opacity-100'}`}>

            {/* Background 1: Sky/Clouds (Takeoff) */}
            <div className={`absolute inset-0 bg-sky-900 transition-opacity duration-1000 ${stage === 'takeoff' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                {/* Moving Clouds */}
                <div className="absolute top-20 left-[-200px] w-40 h-10 bg-white/10 blur-xl rounded-full animate-[cloud_10s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-[-100px] w-60 h-20 bg-white/5 blur-2xl rounded-full animate-[cloud_15s_linear_infinite_delay-2s]"></div>
            </div>

            {/* Background 2: Bangkok (Landing) */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${stage === 'landing' ? 'opacity-100' : 'opacity-0'}`}>
                <img
                    src="https://images.unsplash.com/photo-1583491470869-713a963e9124?q=80&w=1200&auto=format&fit=crop"
                    alt="Bangkok Skyline"
                    className="w-full h-full object-cover animate-[zoomIn_10s_ease-out]"
                />
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">

                {/* Plane Animation */}
                <div className={`
            text-white transform transition-all duration-[2500ms] ease-in-out
            ${stage === 'takeoff' ? 'scale-50 translate-y-[200px] translate-x-[-100px] opacity-0' : ''} 
            ${stage === 'takeoff' && 'animate-[flyIn_2.5s_ease-out_forwards]'}
            ${stage === 'landing' ? 'scale-100 translate-y-0 translate-x-0' : ''}
        `}>
                    <div className="relative">
                        {/* Plane Icon */}
                        <Plane size={64} className={`text-brand-amber transform rotate-[-45deg] drop-shadow-[0_0_15px_rgba(255,171,0,0.5)] ${stage === 'landing' ? 'animate-pulse' : ''}`} />

                        {/* Trail/Reaction */}
                        <div className="absolute top-1/2 right-full w-20 h-1 bg-gradient-to-l from-white/50 to-transparent blur-sm"></div>
                    </div>
                </div>

                {/* Text Animation */}
                <div className="text-center mt-12 z-10">
                    {stage === 'takeoff' && (
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-white animate-pulse tracking-widest uppercase opacity-0 animate-[fadeInUp_1s_ease-out_1s_forwards]">
                            Décollage...
                        </h1>
                    )}

                    {stage === 'landing' && (
                        <div className="animate-[fadeInUp_1s_ease-out_forwards]">
                            <h1 className="text-5xl md:text-7xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                                SAWASDEE
                            </h1>
                            <p className="text-xl text-brand-amber font-medium tracking-[0.2em] uppercase drop-shadow-md">
                                Bangkok, Thaïlande
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default IntroAnimation;
