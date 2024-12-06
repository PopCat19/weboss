/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: 'jit',
    content: [
        "./**/*.html",
        "./js/**/*.js",
    ],
    theme: {
        extend: {
            height: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            width: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            gap: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            padding: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            margin: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            borderRadius: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            typography: {
                DEFAULT: {
                    css: {
                        fontFamily: 'Fredoka',
                        fontWeight: 'semi-bold',
                        fontSize: '16px',
                        lineHeight: '24px',
                        letterSpacing: '0.04em',
                    },
                },
            },
            fontSize: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            fontWeight: {
                semiBold: '600',
                medium: '500',
            },
            lineHeight: {
                '4px': '4px',
                '8px': '8px',
                '12px': '12px',
                '16px': '16px',
                '20px': '20px',
                '24px': '24px',
                '32px': '32px',
                '40px': '40px',
                '48px': '48px',
                '64px': '64px',
                '80px': '80px',
                '96px': '96px',
                '128px': '128px',
                '256px': '256px',
                '512px': '512px',
            },
            letterSpacing: {
                '0.04': '0.04em',
                '0.00': '0.00em',
            },
            colors: {
                white: {
                    100: '#FFFFFF', // 100% opacity - For white; greatest contrast diff. Universal/neutral. P0
                    32: '#FFFFFFCC', // 32% opacity - Waned variant; mixes with layer color beneath.
                },
                primaryCrimson: {
                    100: '#FFC2D1', // 100% opacity 88x on custom color palette; for headings, subheadings contrastive, CTA buttons.. P1
                    32: '#FFC2D1CC', // 32% opacity Waned variant.
                },
                secondaryCrimson: {
                    100: '#FF99B2', // 100% opacity 80x on custom color palette; for body text. P2
                    32: '#FF99B2CC', // 32% opacity Waned variant.
                    12: '#FF99B21F', // 12% opacity Used as surface layer above base 100% or transparent layer.
                },
                accentCrimson: {
                    100: '#FF4775', // 100% opacity 64x on custom color palette; for sub text, links.. P3
                    32: '#FF4775CC', // 32% opacity Waned variant.
                },
                baseCrimson: {
                    100: '#1E0B10', // 100% opacity 8x on custom color palette; for background, text on container, dark text.. B0
                    64: '#1E0B10A0', // 64% opacity Used as surface layer above image layer. Buttons, gradiant..
                },
                black: {
                    100: '#000000', // 100% opacity For black; greatest contrast diff. Universal/neutral. B1
                    80: '#000000CC', // 80% opacity Waned variant; mixes with layer color beneath.
                },
            },
            navLink: {
                display: 'flex',

            },
        },
    },
    plugins: [require("@catppuccin/tailwindcss")],
}