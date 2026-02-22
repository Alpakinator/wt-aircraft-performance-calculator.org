// Deep object
const deepObj = {
    modifications1: {
        octan_spitfire: {
            effects: {
                afterburnerMult: {
                    a110: 1.5
                }
            }
        }
    }
};

// Shallow object with flattened structure
const shallowObj = {
    'octan_spitfire_afterburnerMult_110': 1.5
};

// function runBenchmark() {
//     const iterations = 1000000;
    
//     // Test deep access
//     console.time('deep access');
//     for (let i = 0; i < iterations; i++) {
//         const value = deepObj.modifications['octan_spitfire'].effects.afterburnerMult['110'];
//     }
//     console.timeEnd('deep access');
    
//     // Test shallow access
//     console.time('shallow access');
//     for (let i = 0; i < iterations; i++) {
//         const value = shallowObj['octan_spitfire_afterburnerMult_110'];
//     }
//     console.timeEnd('shallow access');
// }



function runBenchmark() {
    const iterations = 10000000;
    

    // Test dot notation
    console.time('dot notation');
    for (let i = 0; i < iterations; i++) {
        const value = deepObj['modifications1'].octan_spitfire.effects.afterburnerMult.a110;
    }
    console.timeEnd('dot notation');

    console.time('bracket notation');
    for (let i = 0; i < iterations; i++) {
        const value = deepObj['modifications1']['octan_spitfire']['effects']['afterburnerMult']['a110'];
    }
    console.timeEnd('bracket notation');
    
    // Test bracket notation

}

runBenchmark();