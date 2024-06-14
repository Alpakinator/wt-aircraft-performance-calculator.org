import Plotly from 'plotly.js-dist';
import type { HtmlTagDescriptor } from 'vite';

interface PowerCurve {
	[key: number]: number;
}

interface NamedPowerCurves {
	[key: string]: {
		military?: PowerCurve;
		WEP?: PowerCurve;
	};
}

interface DataFrameRow {
	[key: string]: number[] | number | null | undefined;
}

export function dict_dataframer(
	named_power_curves_merged: NamedPowerCurves,
	alt_unit: string
): DataFrameRow[] {
	let altitudeValues: number[] = [];
	let enginePowerData: { [planeName: string]: { [mode: string]: number[] } } = {};

	// Iterate over each plane
	for (let planeName in named_power_curves_merged) {
		let powerCurvesMerged = named_power_curves_merged[planeName];

		// Iterate over each mode (WEP or mil)
		for (let mode in powerCurvesMerged) {
			// Initialize array for engine power values for the current plane and mode combination
			if (!enginePowerData[planeName]) {
				enginePowerData[planeName] = {};
			}

			// Initialize array for the current mode
			enginePowerData[planeName][mode] = [];

			// Iterate over altitude values for the current plane and mode combination
			for (let altitudeStr in powerCurvesMerged[mode]) {
				let altitude = Number(altitudeStr);

				// Store altitude values
				if (!altitudeValues.includes(altitude)) {
					altitudeValues.push(altitude);
				}

				// Store engine power values for the current plane and mode combination
				enginePowerData[planeName][mode].push(powerCurvesMerged[mode][altitudeStr]);
			}
		}
	}

	// Sort altitude values
	altitudeValues.sort((a, b) => a - b);

	// Construct final data frame rows
	let final_data: DataFrameRow[] = [];
	final_data.push({ 'Altitude [m]': altitudeValues });

	// Add engine power data for each plane and mode combination
	// for (let planeName in enginePowerData) {
	// 	let planeData = enginePowerData[planeName];
	// 	for (let mode in planeData) {
	// 		final_data.push({ [planeName + ' (' + mode + ')']: planeData[mode] });
	// 	}
	// }
	for (let planeName in enginePowerData) {
		let planeData = enginePowerData[planeName];
			final_data[planeName] = planeData;
		
	}

	return final_data;
}

export function plotter(
	final_data,
	all_values,
	chosenplanes,
	max_alt,
	alt_unit,
	speed,
	speed_type,
	speed_unit,
	air_temp,
	air_temp_unit,
	axis_layout,
	performance_type,
	colour_set,
	hoverstyle,
	bg_col
) {
	console.log(final_data)
	let font_fam = 'Inter';
	const alt_vals: number = final_data[0]['Altitude [m]'];
	final_data.shift();
	// console.log(final_data)
	const final_object: {
		x: any;
		y: any;
		mode: string;
		line: { width: number; shape: string; dash: string };
		type: string;
		name: string;
		marker;
		hoverinfo;
		text;
		// hovertemplate;
	}[] = [];

	let highest_x, lowest_x, title, x_axis_title, x_axis_tick;
	let highest_y, lowest_y, y_axis_title, y_axis_tick;
	let no_bugwarning_angle,
		no_bugwarning_x,
		no_bugwarning_y,
		no_bugwarning_x_anchor,
		no_bugwarning_y_anchor;
	let air_temp_info = 'Temperature at sea level: ' + air_temp + ' ' + air_temp_unit;
	let plane: number;
	let colo_index = 0;
	let line_dashes = ['solid', 'dash']
	if (axis_layout) {
		for (const plane in final_data) {
			let dash_index = 0
			for (const mode in final_data[plane]) {
				let plane_mode = plane + ' (' + mode + ')'
				final_object.push({
					x: final_data[plane][mode],
					y: alt_vals,
					mode: 'lines',
					line: { width: 3, shape: 'linear', dash: line_dashes[dash_index] },
					type: 'linegl',
					name: plane_mode,
					marker: { color: colour_set[colo_index] },
					hoverinfo: 'x+y+text',
					text: plane_mode
					//         hovertemplate:
					// "%{text}" +
					// "%{yaxis.title.text}: %{y:}<br>" +
					// "%{xaxis.title.text}: %{x:}<br>" +
					// "<extra></extra>"
					
				});
				dash_index++;
			}
			colo_index++;
		}
		no_bugwarning_angle = 270;
		no_bugwarning_x = 1;
		no_bugwarning_y = 0;
		no_bugwarning_x_anchor = 'right';
		no_bugwarning_y_anchor = 'bottom';
		if (performance_type === 'power') {
			title =
				'Engine power at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_x = Math.max(...all_values);
			lowest_x = Math.min(...all_values);
			console.log('here they are', lowest_x, highest_x, all_values)
			highest_x = Math.ceil((highest_x + 100) / 100) * 100;
			lowest_x = Math.floor((lowest_x - 100) / 100) * 100;
			if(lowest_x<0){lowest_x=0}
			x_axis_title = 'Power [hp]';
			x_axis_tick = 100;
			lowest_y = 0;
			highest_y = max_alt;
			y_axis_title = 'Altitude [' + alt_unit + ']';
			y_axis_tick = 1000;
			if (alt_unit == 'ft') {
				y_axis_tick = 3000;
			}
		} else if (performance_type === 'power/weight') {
			title =
				'Power-to-weight at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_x = Math.max(...all_values);
			lowest_x = Math.min(...all_values);
			highest_x += 0.03;
			lowest_x -= 0.03;
			if(lowest_x<0){lowest_x=0}
			x_axis_title = 'Power/Weight [hp/kg]';
			x_axis_tick = 0.05;
			lowest_y = 0;
			highest_y = max_alt;
			y_axis_title = 'Altitude [' + alt_unit + ']';
			y_axis_tick = 1000;
			if (alt_unit == 'ft') {
				y_axis_tick = 3000;
			}
		}
	} else {
		for (const plane in final_data) {
			let dash_index = 0
			for (const mode in final_data[plane]) {
				let plane_mode = plane + '(' + mode + ')'
				final_object.push({
					y: final_data[plane][mode],
					x: alt_vals,
					mode: 'lines',
					line: { width: 3, shape: 'linear', dash: line_dashes[dash_index] },
					type: 'linegl',
					name: plane_mode,
					marker: { color: colour_set[colo_index]},
					hoverinfo: 'x+y+text',
					text: plane_mode
					//         hovertemplate:
					//         "<b>%{text}</b><br><br>" +
					// "%{yaxis.title.text}: %{y:$,.0f}<br>" +
					// "%{xaxis.title.text}: %{x:}<br>" +
					// "Number Employed: %{marker.size:,}" +
					// "<extra></extra>"
				});
				dash_index++;
			}
			colo_index++;
		}
		no_bugwarning_angle = 0;
		no_bugwarning_x = 1;
		no_bugwarning_y = -0.008;
		no_bugwarning_x_anchor = 'right';
		no_bugwarning_y_anchor = 'bottom';
		if (performance_type === 'power') {
			title =
				'Engine power at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_y = Math.max(...all_values);
			lowest_y = Math.min(...all_values);
			highest_y = Math.ceil((highest_y + 100) / 100) * 100;
			lowest_y = Math.floor((lowest_y - 100) / 100) * 100;
			if(lowest_y<0){lowest_y=0}
			y_axis_title = 'Power [hp]';
			y_axis_tick = 100;
			lowest_x = 0;
			highest_x = max_alt;
			x_axis_title = 'Altitude [' + alt_unit + ']';
			x_axis_tick = 1000;
			if (alt_unit == 'ft') {
				x_axis_tick = 3000;
			}
		} else if (performance_type === 'power/weight') {
			title =
				'Power-to-weight at different altitudes, when flying at ' +
				speed +
				' ' +
				speed_unit +
				' ' +
				speed_type;
			highest_y = Math.max(...all_values);
			lowest_y = Math.min(...all_values);
			highest_y += 0.03;
			lowest_y -= 0.03;
			if(lowest_y<0){lowest_y=0}
			y_axis_title = 'Power/Weight [hp/kg]';
			y_axis_tick = 0.05;
			lowest_x = 0;
			highest_x = max_alt;
			x_axis_title = 'Altitude [' + alt_unit + ']';
			x_axis_tick = 1000;
			if (alt_unit == 'ft') {
				x_axis_tick = 3000;
			}
		}
	}
	var layout = {
		paper_bgcolor: bg_col,
		plot_bgcolor: bg_col,
		autosize: true,
		title: { text: title, font: { size: 22 }, x: 0.5 },
		legend: {
			yanchor: 'top',
			y: 1,
			xanchor: 'right',
			x: 1,
			font: { size: 16, family: font_fam },
			title: null
		},
		showlegend: true,
		hoverlabel: { font: { color: '#fdfdfde6', size: 16 }, bordercolor: '#142E40', borderwidth: 1 },
		hovermode: hoverstyle,
		font: { family: font_fam, color: '#fdfdfde6' },
		margin: { l: 110, r: 25, b: 65, t: 60, pad: 5 },
		modebar: {
			orientation: 'v',
			xanchor: 'left',
			yanchor: 'bottom',
			bgcolor: 'rgba(0,0,0,0)',
			color: '#fdfdfde6',
			activecolor: '#006FA1',
			font: { size: 24 },
			add: ['hoverclosest', 'hovercompare'],
			remove: ['autoscale'],
		},
		dragmode: 'pan',
		annotations: [
			{
				text: air_temp_info,
				showarrow: false,
				font: { size: 14 },
				x: 0,
				y: -0.08,
				xref: 'paper',
				yref: 'paper',
				xanchor: 'left',
				yanchor: 'bottom'
			},
			{
				text: "Do not use in War Thunder bug reports, because it's not <br>a valid source. Otherwise Gaijin can ban datamining forever!",
				opacity: 0.35,
				showarrow: false,
				font: { size: 16, color: 'white', family: font_fam },
				x: no_bugwarning_x,
				y: no_bugwarning_y,
				xref: 'paper',
				yref: 'paper',
				xanchor: no_bugwarning_x_anchor,
				yanchor: no_bugwarning_y_anchor,
				textangle: no_bugwarning_angle
			}
		],
		xaxis: {
			gridcolor: '#1A242E',
			gridwidth: 2,
			zerolinecolor: '#1A242E',
			zerolinewidth: 3,
			font: { size: 18, family: 'Inter', color: '#fdfdfde6' },
			title: { text: x_axis_title, font: { size: 18 }, standoff: 20 },
			range: [lowest_x, highest_x],
			dtick: x_axis_tick,
			tickfont: { size: 16 }
		},
		yaxis: {
			gridcolor: '#1A242E',
			gridwidth: 2,
			zerolinecolor: '#1A242E',
			zerolinewidth: 3,
			font: { size: 18, family: 'Inter', color: '#fdfdfde6' },
			title: { text: y_axis_title, font: { size: 18 }, standoff: 10 },
			range: [lowest_y, highest_y],
			dtick: y_axis_tick,
			tickfont: { size: 16 }
		},
		images: [
			{
				x: 0,
				y: 0.0015,
				sizex: 0.11,
				sizey: 0.11,
				source: 'images/WTAPC_logo_nograph_text.png',
				opacity: 0.5,
				xanchor: 'left',
				xref: 'paper',
				yanchor: 'bottom',
				yref: 'paper'
			}
		]
	};
	var config = {
		scrollZoom: true,
		displayModeBar: true,
		displaylogo: false,
		responsive: true,
		showEditInChartStudio: true,
		plotlyServerURL: 'https://chart-studio.plotly.com',
		toImageButtonOptions: {
			filename: 'performance_plot',
			format: 'png'
		}
	};
	Plotly.newPlot('graphid', final_object, layout, config);

	// return final_plot;
}

// { text: 'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>'+
//         'Not to be used for War Thunder bug reports<br>', "opacity": 0.06, showarrow: false, font: { size: 30, family: ['symbols_skyquake', "Intervar"]}, x: 0.53, y: 0, xref: "paper", yref: "paper", xanchor: "left", yanchor: "bottom"},
