'use client';

import { motion } from 'motion/react';

interface LogoProps {
    size?: number | string;
    animate?: boolean;
}

const LOGO_DRAW_DURATION_S = 0.8;
const LOGO_STAGGER_S = 0.15;
const LOGO_FADE_DURATION_S = 0.6;

const paths = [
    "M50 5 L90 28 L90 72 L50 95 L10 72 L10 28 Z",
    "M10 28 L50 5 L90 28",
    "M10 72 L50 95 L90 72",
    "M10 28 L28 65 L72 65 L90 28",
    "M28 65 L50 95 L72 65",
    "M50 5 L50 45 L28 65",
    "M50 45 L72 65",
    "M10 28 L50 45 L90 28",
];

export const LOGO_DRAW_END_MS = Math.round(
    ((paths.length - 1) * LOGO_STAGGER_S + LOGO_DRAW_DURATION_S) * 1000
);

export default function Logo({ size = 48, animate = false }: LogoProps) {
    const sizeValue = size === '100%' ? '100%' : size;

    if (animate) {
        const drawDuration = LOGO_DRAW_DURATION_S;
        const stagger = LOGO_STAGGER_S;
        const fadeDuration = LOGO_FADE_DURATION_S;

        const drawEndTime = (paths.length - 1) * stagger + drawDuration;
        const cycleDuration = drawEndTime + fadeDuration;

        return (
            <motion.svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                width={sizeValue}
                height={sizeValue}
                className="text-primary"
            >
                <motion.g
                    initial={{ opacity: 1 }}
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{
                        duration: cycleDuration,
                        times: [0, drawEndTime / cycleDuration, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                    }}
                >
                    {paths.map((d, index) => {
                        const startTime = index * stagger;
                        const endTime = startTime + drawDuration;

                        return (
                            <motion.path
                                key={index}
                                d={d}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: [0, 0, 1, 1],
                                    opacity: [0, 0, 1, 1],
                                }}
                                transition={{
                                    pathLength: {
                                        duration: cycleDuration,
                                        times: [
                                            0,
                                            startTime / cycleDuration,
                                            endTime / cycleDuration,
                                            1,
                                        ],
                                        ease: "easeInOut",
                                        repeat: Infinity,
                                    },
                                    opacity: {
                                        duration: cycleDuration,
                                        times: [
                                            0,
                                            startTime / cycleDuration,
                                            endTime / cycleDuration,
                                            1,
                                        ],
                                        ease: "linear",
                                        repeat: Infinity,
                                    },
                                }}
                            />
                        );
                    })}
                </motion.g>
            </motion.svg>
        );
    }

    return (
        <motion.svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            width={sizeValue}
            height={sizeValue}
            className="text-primary"
        >
            {paths.map((d, index) => (
                <path
                    key={index}
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
            ))}
        </motion.svg>
    );
}
