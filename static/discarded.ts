// export function plotly_generator_with_slider_old(
// 	power_matrices, // Result from createPowerMatrix: [{ engine, mode, matrix }]
// 	alt_values, // Array of altitude values (in meters)
// 	speed_values, // Array of speed values (in km/h)
// 	chosenplanes,
// 	chosenplanes_ingame,
// 	power_unit,
// 	weight_unit,
// 	max_alt,
// 	alt_unit,
// 	alt_factor,
// 	speed_factor,
// 	speed_type,
// 	speed_unit,
// 	air_temp,
// 	air_temp_unit,
// 	axis_layout,
// 	performance_type,
// 	colour_set,
// 	hoverstyle,
// 	bg_col
// ) {
// 	let font_fam = 'Inter';
// 	// Create a lookup table to organize data by airspeed
// 	const lookup = {};

// 	// Helper function to get/create data trace for a specific speed and plane
// 	function getData(speedIndex, engineIndex, mode) {
// 		if (!lookup[speedIndex]) {
// 			lookup[speedIndex] = {};
// 		}

// 		const traceKey = `${engineIndex}_${mode}`;
// 		if (!lookup[speedIndex][traceKey]) {
// 			lookup[speedIndex][traceKey] = {
// 				x: [], // Will hold power values
// 				y: [] // Will hold altitude values
// 			};
// 		}

// 		return lookup[speedIndex][traceKey];
// 	}

// 	// Populate the lookup table with data from power matrices
// 	power_matrices.forEach((item) => {
// 		const { engine, mode, matrix } = item;
// 		const planeName = chosenplanes_ingame[engine] || `Engine ${engine}`;

// 		// For each speed (column in the matrix)
// 		for (let speedIdx = 0; speedIdx < matrix.length; speedIdx++) {
// 			const trace = getData(speedIdx, engine, mode);

// 			// For each altitude (row in the matrix)
// 			for (let altIdx = 0; altIdx < matrix[speedIdx].length; altIdx++) {
// 				const powerValue = matrix[speedIdx][altIdx];
// 				const altitudeValue = altIdx * 20; // Assuming altitude step is 10m

// 				trace.x.push(powerValue);
// 				trace.y.push(altitudeValue / alt_factor); // Convert to display units
// 			}
// 		}
// 	});

// 	// Get the unique speed indices
// 	const speedIndices = Object.keys(lookup).map(Number);

// 	// Create initial traces for the first speed
// 	const firstSpeedIndex = speedIndices[0];
// 	const firstSpeedData = lookup[firstSpeedIndex];

// 	// Track all values for setting axis ranges
// 	let all_values: number[] = [];

// 	// Prepare initial traces
// 	interface Trace {
// 		x: number[];
// 		y: number[];
// 		mode: string;
// 		line: { width: number; shape: string; dash: string };
// 		type: string;
// 		name: string;
// 		marker: { color: string };
// 		hoverinfo: string;
// 		text: string;
// 	}
// 	const traces: Trace[] = [];
// 	let colo_index = 0;
// 	let line_dashes = ['solid', 'dash'];

// 	// Create traces for each plane/mode combination
// 	Object.keys(firstSpeedData).forEach((key) => {
// 		const [engineIndex, mode] = key.split('_');
// 		const planeName = chosenplanes_ingame[engineIndex] || `Engine ${engineIndex}`;
// 		const plane_mode = `${planeName} (${mode})`;
// 		const dash_index = mode === 'WEP' ? 0 : 1;

// 		// Add this trace's values to all_values for range calculation
// 		all_values = [...all_values, ...firstSpeedData[key].x];

// 		if (axis_layout) {
// 			traces.push({
// 				x: firstSpeedData[key].x.slice(),
// 				y: firstSpeedData[key].y.slice(),
// 				mode: 'lines',
// 				line: { width: 3, shape: 'linear', dash: line_dashes[dash_index] },
// 				type: 'linegl',
// 				name: plane_mode,
// 				marker: { color: colour_set[colo_index % colour_set.length] },
// 				hoverinfo: 'x+y+text',
// 				text: plane_mode
// 			});
// 		} else {
// 			traces.push({
// 				y: firstSpeedData[key].x.slice(),
// 				x: firstSpeedData[key].y.slice(),
// 				mode: 'lines',
// 				line: { width: 3, shape: 'linear', dash: line_dashes[dash_index] },
// 				type: 'linegl',
// 				name: plane_mode,
// 				marker: { color: colour_set[colo_index % colour_set.length] },
// 				hoverinfo: 'x+y+text',
// 				text: plane_mode
// 			});
// 		}

// 		// Increment color index for the next plane
// 		if (mode === 'WEP') {
// 			colo_index++;
// 		}
// 	});

// 	// Create frames for each speed
// 	interface Frame {
// 		name: string;
// 		data: { x?: number[]; y?: number[] }[];
// 	}
// 	const frames: Frame[] = [];

// 	for (let i = 0; i < speedIndices.length; i++) {
// 		const speedIndex = speedIndices[i];
// 		const speedKph = speed_values[speedIndex];

// 		const frameData: { x?: number[]; y?: number[] }[] = [];
// 		let traceIndex = 0;

// 		Object.keys(lookup[speedIndex]).forEach((key) => {
// 			const data = lookup[speedIndex][key];

// 			if (axis_layout) {
// 				frameData.push({
// 					x: data.x.slice(),
// 					y: data.y.slice()
// 				});
// 			} else {
// 				frameData.push({
// 					y: data.x.slice(),
// 					x: data.y.slice()
// 				});
// 			}

// 			// Add to all_values for axis range calculation
// 			all_values = [...all_values, ...data.x];

// 			traceIndex++;
// 		});

// 		frames.push({
// 			name: speedKph.toString(),
// 			data: frameData
// 		});
// 	}

// 	// Create slider steps
// 	interface SliderStep {
// 		method: string;
// 		label: string;
// 		args: [
// 			string[],
// 			{
// 				mode: string;
// 				transition: { duration: number };
// 				frame: { duration: number; redraw: boolean };
// 			}
// 		];
// 	}

// 	const sliderSteps: SliderStep[] = [];

// 	for (let i = 0; i < speedIndices.length; i++) {
// 		const speedKph = speed_values[speedIndices[i]];
// 		const speedDisplay = (speedKph / speed_factor).toFixed(0); // Convert to display units

// 		sliderSteps.push({
// 			method: 'animate',
// 			label: speedDisplay,
// 			args: [
// 				[speedKph.toString()],
// 				{
// 					mode: 'immediate',
// 					transition: { duration: 0 },
// 					frame: { duration: 0, redraw: false }
// 				}
// 			]
// 		});
// 	}

// 	// Prepare layout variables
// 	let highest_x, lowest_x, title, x_axis_title, x_axis_tick;
// 	let highest_y, lowest_y, y_axis_title, y_axis_tick;
// 	let no_bugwarning_angle,
// 		no_bugwarning_x,
// 		no_bugwarning_y,
// 		no_bugwarning_x_anchor,
// 		no_bugwarning_y_anchor;

// 	// Air temperature info message
// 	let air_temp_info = 'Temperature at sea level: ' + air_temp + ' ' + air_temp_unit;

// 	// Setup axis layout based on user preference
// 	if (axis_layout) {
// 		no_bugwarning_angle = 270;
// 		no_bugwarning_x = 1;
// 		no_bugwarning_y = 0;
// 		no_bugwarning_x_anchor = 'right';
// 		no_bugwarning_y_anchor = 'bottom';

// 		if (performance_type === 'power') {
// 			title = 'Engine power at different altitudes (use slider to change airspeed)';
// 			highest_x = Math.max(...all_values);
// 			lowest_x = Math.min(...all_values);
// 			highest_x = Math.ceil(highest_x * 1.05);
// 			lowest_x = Math.floor(lowest_x * 0.95);
// 			if (lowest_x < 0) lowest_x = 0;

// 			x_axis_title = 'Power [' + power_unit + ']';
// 			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
// 			lowest_y = 0;
// 			highest_y = max_alt;
// 			y_axis_title = 'Altitude [' + alt_unit + ']';
// 			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
// 		} else if (performance_type === 'power/weight') {
// 			title = 'Power / Weight at different altitudes (use slider to change airspeed)';
// 			highest_x = Math.max(...all_values);
// 			lowest_x = Math.min(...all_values);
// 			highest_x = Math.ceil(highest_x * 1.05);
// 			lowest_x = Math.floor(lowest_x * 0.95);
// 			if (lowest_x < 0) lowest_x = 0;

// 			x_axis_title = 'Power / Weight [' + power_unit + '/' + weight_unit + ']';
// 			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
// 			lowest_y = 0;
// 			highest_y = max_alt;
// 			y_axis_title = 'Altitude [' + alt_unit + ']';
// 			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
// 		}
// 	} else {
// 		no_bugwarning_angle = 0;
// 		no_bugwarning_x = 1;
// 		no_bugwarning_y = -0.008;
// 		no_bugwarning_x_anchor = 'right';
// 		no_bugwarning_y_anchor = 'bottom';

// 		if (performance_type === 'power') {
// 			title = 'Engine power at different altitudes (use slider to change airspeed)';
// 			highest_y = Math.max(...all_values);
// 			lowest_y = Math.min(...all_values);
// 			highest_y = highest_y * 1.05;
// 			lowest_y = lowest_y * 0.95;
// 			if (lowest_y < 0) lowest_y = 0;

// 			y_axis_title = 'Power [' + power_unit + ']';
// 			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
// 			lowest_x = 0;
// 			highest_x = max_alt;
// 			x_axis_title = 'Altitude [' + alt_unit + ']';
// 			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
// 		} else if (performance_type === 'power/weight') {
// 			title = 'Power / Weight at different altitudes (use slider to change airspeed)';
// 			highest_y = Math.max(...all_values);
// 			lowest_y = Math.min(...all_values);
// 			highest_y = highest_y * 1.05;
// 			lowest_y = lowest_y * 0.95;
// 			if (lowest_y < 0) lowest_y = 0;

// 			y_axis_title = 'Power / Weight [' + power_unit + '/' + weight_unit + ']';
// 			y_axis_tick = calculateTickInterval(lowest_y, highest_y);
// 			lowest_x = 0;
// 			highest_x = max_alt;
// 			x_axis_title = 'Altitude [' + alt_unit + ']';
// 			x_axis_tick = calculateTickInterval(lowest_x, highest_x);
// 		}
// 	}

// 	// Create the layout
// 	var layout = {
// 		uirevision: 'true',
// 		paper_bgcolor: bg_col,
// 		plot_bgcolor: bg_col,
// 		autosize: true,
// 		title: { text: title, font: { size: 22 }, x: 0.5 },
// 		legend: {
// 			yanchor: 'top',
// 			y: 1,
// 			xanchor: 'right',
// 			x: 1,
// 			font: { size: 16, family: font_fam },
// 			title: null
// 		},
// 		showlegend: true,
// 		hoverlabel: { font: { color: '#fdfdfde6', size: 14 }, bordercolor: '#142E40', borderwidth: 1 },
// 		hovermode: hoverstyle,
// 		font: { family: font_fam, color: '#fdfdfde6' },
// 		margin: { l: 110, r: 25, b: 100, t: 60, pad: 5 }, // Increased bottom margin for slider
// 		modebar: {
// 			orientation: 'v',
// 			xanchor: 'left',
// 			yanchor: 'bottom',
// 			bgcolor: 'rgba(0,0,0,0)',
// 			color: 'rgb(205, 215, 225)',
// 			activecolor: 'rgb(0, 111, 161)',
// 			font: { size: 24 },
// 			add: ['hoverclosest', 'hovercompare'],
// 			remove: ['resetScale2d']
// 		},
// 		dragmode: 'pan',
// 		annotations: [
// 			{
// 				text: air_temp_info,
// 				showarrow: false,
// 				font: { size: 14 },
// 				x: 0,
// 				y: 1,
// 				xref: 'paper',
// 				yref: 'paper',
// 				xanchor: 'left',
// 				yanchor: 'bottom'
// 			},
// 			{
// 				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining forever!",
// 				opacity: 0.15,
// 				showarrow: false,
// 				font: { size: 14, color: 'white', family: font_fam },
// 				x: no_bugwarning_x,
// 				y: no_bugwarning_y,
// 				xref: 'paper',
// 				yref: 'paper',
// 				xanchor: no_bugwarning_x_anchor,
// 				yanchor: no_bugwarning_y_anchor,
// 				textangle: no_bugwarning_angle
// 			}
// 		],
// 		xaxis: {
// 			gridcolor: 'rgba(47, 62, 73, 0.3)',
// 			gridwidth: 1,
// 			zerolinecolor: 'rgba(47, 62, 73, 0.3)',
// 			zerolinewidth: 3,
// 			maxallowed: highest_x * 2,
// 			minallowed: 0,
// 			font: { size: 18, family: font_fam, color: '#fdfdfde6' },
// 			title: { text: x_axis_title, font: { size: 18 }, standoff: 20 },
// 			range: [lowest_x, highest_x],
// 			dtick: x_axis_tick,
// 			tickfont: { size: 16 }
// 		},
// 		yaxis: {
// 			gridcolor: 'rgba(47, 62, 73, 0.3)',
// 			gridwidth: 1,
// 			zerolinecolor: 'rgba(47, 62, 73, 0.3)',
// 			zerolinewidth: 3,
// 			font: { size: 18, family: font_fam, color: '#fdfdfde6' },
// 			title: { text: y_axis_title, font: { size: 18 }, standoff: 10 },
// 			range: [lowest_y, highest_y],
// 			maxallowed: highest_y * 2,
// 			minallowed: 0,
// 			dtick: y_axis_tick,
// 			tickfont: { size: 16 }
// 		},
// 		images: [
// 			{
// 				x: 0,
// 				y: 0.0015,
// 				sizex: 0.11,
// 				sizey: 0.11,
// 				source: 'images/WTAPC_logo_nograph_text.png',
// 				opacity: 0.5,
// 				xanchor: 'left',
// 				xref: 'paper',
// 				yanchor: 'bottom',
// 				yref: 'paper'
// 			}
// 		],
// 		// Add play/pause buttons
// 		updatemenus: [
// 			{
// 				x: 0,
// 				y: 0,
// 				yanchor: 'top',
// 				xanchor: 'left',
// 				showactive: false,
// 				direction: 'left',
// 				type: 'buttons',
// 				pad: { t: 87, r: 10 }
// 				// buttons: [
// 				// 	{
// 				// 		method: 'animate',
// 				// 		args: [
// 				// 			null,
// 				// 			{
// 				// 				mode: 'immediate',
// 				// 				fromcurrent: true,
// 				// 				transition: { duration: 0 },
// 				// 				frame: { duration: 200, redraw: false }
// 				// 			}
// 				// 		],
// 				// 		label: 'Play'
// 				// 	},
// 				// 	{
// 				// 		method: 'animate',
// 				// 		args: [
// 				// 			[null],
// 				// 			{
// 				// 				mode: 'immediate',
// 				// 				transition: { duration: 0 },
// 				// 				frame: { duration: 0, redraw: false }
// 				// 			}
// 				// 		],
// 				// 		label: 'Pause'
// 				// 	}
// 				// ]
// 			}
// 		],
// 		// Add the speed slider
// 		sliders: [
// 			{
// 				pad: { l: 0, t: 30, b: 10, r: 0 },
// 				currentvalue: {
// 					visible: true,
// 					id: 'speed_annotation',
// 					prefix: speed_type + ' Speed: ',
// 					suffix: ' ' + speed_unit,
// 					xanchor: 'left',
// 					offset: 5,
// 					font: { size: 16, color: '#fdfdfde6' }
// 				},
// 				len: 1,
// 				x: 0,
// 				xanchor: 'left',
// 				steps: sliderSteps,
// 				tickvals: [0, speedIndices.length - 1],
// 				ticktext: [
// 					(speed_values[speedIndices[0]] / speed_factor).toFixed(0),
// 					(speed_values[speedIndices[speedIndices.length - 1]] / speed_factor).toFixed(0)
// 				],
// 				font: { color: '#fdfdfde6' },
// 				tickcolor: '#fdfdfde6',
// 				tickwidth: 2,
// 				// Add a function that updates our custom label
// 				active: 30 // Start with the first step selected
// 			}
// 		]
// 	};

// 	// Create the plot config
// 	var config = {
// 		scrollZoom: true,
// 		displayModeBar: true,
// 		displaylogo: false,
// 		responsive: true,
// 		showEditInChartStudio: false,
// 		plotlyServerURL: 'https://chart-studio.plotly.com',
// 		toImageButtonOptions: {
// 			filename: 'performance_plot',
// 			format: 'svg'
// 		}
// 	};

// 	// Create the plot
// 	Plotly.newPlot('graphid', {
// 		data: traces,
// 		layout: layout,
// 		frames: frames,
// 		config: config
// 	});
// }