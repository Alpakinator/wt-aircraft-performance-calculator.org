import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({ fallback: '404.html' }),

		paths: {
			base: process.argv.includes('dev') ? '' : process.env.BASE_PATH
		}
	}
	// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
	// If your environment is not supported or you settled on a specific environment, switch out the adapter.
	// See https://kit.svelte.dev/docs/adapters for more information about adapters.
};

export default config;

// export default {
// 	kit: {
// 		adapter: adapter({
// 			// default options are shown. On some platforms
// 			// these options are set automatically — see below
// 			pages: 'build',
// 			assets: 'build',
// 			fallback: undefined,
// 			precompress: false,
// 			strict: true
// 		})
// 	}
// };
