let chosenplanes = ['a6m5', 'p-51d30', 'a-26c-45-dt', 'p-51d10',]
let planefm_jsons = {}
async function fetchPlaneData() {
try {
    // Create an array of promises for all fetch operations
    const fetchPromises = chosenplanes.map(async (plane, index) => {
        const response = await fetch(
            `https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_mass_files/plane_mass_piston.json`
        );
        
        if (response.ok) {
            const data = await response.json();
            return { plane, data };
        }
        throw new Error(`Failed to fetch data for ${plane}: ${response.status}`);
    });

    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);

    // Process all results and add them to planefm_jsons
    results.forEach(({ plane, data }) => {
        planefm_jsons[plane] = data;
    });
    
} catch (error) {
    console.error('Error fetching plane data:', error);
    throw error;
}
}
async function fetchPlaneDataShort() {
try {
    // Create an array of promises for all fetch operations
    const fetchPromises = chosenplanes.map(async (plane, index) => {
        const response = await fetch(
            `https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/plane_mass_files/plane_mass_piston.json`
        );
        
        if (response.ok) {
            const data = await response.json();
            planefm_jsons[plane] = data
            return;
        }
        throw new Error(`Failed to fetch data for ${plane}: ${response.status}`);
    });
await Promise.all(fetchPromises);   
 
} catch (error) {
    console.error('Error fetching plane data:', error);
    throw error;
}
}