/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./**/*.html",
        "./js/**/*.js",
    ],
    theme: {
        extend: {
            gap: {
                '8': '8px',
                '16': '16px',
                '32': '32px',
                '64': '64px',
                '80': '80px',
                '128': '128px',
            },
            padding: {
                '8': '8px',
                '16': '16px',
                '32': '32px',
                '64': '64px',
                '80': '80px',
            },
            borderRadius: {
                '8': '8px',
                '16': '16px',
                '32': '32px',
                '64': '64px',
                '80': '80px',
                '128': '128px',
                '256': '256px',
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
                '256': '256px',
                '128': '128px',
                '104': '104px',
                '96': '96px',
                '64': '64px',
                '48': '48px',
                '32': '32px',
                '24': '24px',
                '16': '16px',
            },
            fontWeight: {
                semiBold: '600',
                medium: '500',
            },
            lineHeight: {
                '104': '104px',
                '96': '96px',
                '64': '64px',
                '48': '48px',
                '32': '32px',
                '24': '24px',
            },
            letterSpacing: {
                '0.04': '0.04em',
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
    plugins: [],
}