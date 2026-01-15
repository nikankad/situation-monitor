/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				bg: '#0a0a0a',
				surface: '#141414',
				'surface-hover': '#1a1a1a',
				border: '#2a2a2a',
				'border-light': '#3a3a3a',
				'text-primary': '#e8e8e8',
				'text-dim': '#888888',
				'text-muted': '#666666',
				accent: '#ffffff',
				danger: '#ff4444',
				success: '#44ff88',
				warning: '#ffaa00',
				info: '#4488ff'
			},
			fontFamily: {
				mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'monospace']
			},
			fontSize: {
				'2xs': '0.65rem'
			},
			animation: {
				shimmer: 'shimmer 1.5s infinite'
			},
			keyframes: {
				shimmer: {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				}
			}
		}
	},
	plugins: []
};
