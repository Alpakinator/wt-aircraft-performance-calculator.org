const FM_RAW_BASE_URL =
	'https://raw.githubusercontent.com/Alpakinator/wt-aircraft-performance-calculator/main/output_files/out_fm';

export function getFmJsonUrl(version: string, basePlaneId: string): string {
	const versionSegment = encodeURIComponent(version);
	const planeSegment = encodeURIComponent(basePlaneId);
	return `${FM_RAW_BASE_URL}/fm_${versionSegment}/${planeSegment}.json`;
}
