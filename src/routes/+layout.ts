



// This can be false if you're using a fallback (i.e. SPA mode)
export const prerender = true;
export const ssr = false;

// import { browser } from '$app/environment';

// export const load = async () => {
//   if (browser) {
//     function setScreenWidth() {
//       function updateScreenWidth() {
//         const screenWidth = window.screen.width > window.screen.height ? window.screen.width : window.screen.height;
//         document.documentElement.style.setProperty('--screen-width', `${screenWidth}px`);
//       }

//       // Set the initial value
//       updateScreenWidth();

//       // Update the value on window resize
//       window.addEventListener('resize', updateScreenWidth);

//       // Clean up function
//       return () => {
//         window.removeEventListener('resize', updateScreenWidth);
//       };
//     }

//     const cleanup = setScreenWidth();

//     // Clean up the event listener when the layout is destroyed
//     return {
//       destroy: cleanup
//     };
//   }

//   return {};
// };
