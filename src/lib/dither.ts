// Nord color palette for dithering
const NORD_PALETTE = [
	// Polar Night
	[46, 52, 64], // nord0
	[59, 66, 82], // nord1
	[67, 76, 94], // nord2
	[76, 86, 106], // nord3
	// Snow Storm
	[216, 222, 233], // nord4
	[229, 233, 240], // nord5
	[236, 239, 244], // nord6
	// Frost
	[143, 188, 187], // nord7
	[136, 192, 208], // nord8
	[129, 161, 193], // nord9
	[94, 129, 172], // nord10
	// Aurora
	[191, 97, 106], // nord11
	[208, 135, 112], // nord12
	[235, 203, 139], // nord13
	[163, 190, 140], // nord14
	[180, 142, 173] // nord15
];

function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
	// Euclidean distance in RGB space
	return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function findClosestColor(r: number, g: number, b: number): [number, number, number] {
	let minDistance = Infinity;
	let closestColor: [number, number, number] = [0, 0, 0];

	for (const color of NORD_PALETTE) {
		const distance = colorDistance(r, g, b, color[0], color[1], color[2]);
		if (distance < minDistance) {
			minDistance = distance;
			closestColor = [color[0], color[1], color[2]];
		}
	}

	return closestColor;
}

export function ditherImage(imageData: ImageData, noiseAmount: number = 0.1): ImageData {
	const { width, height, data } = imageData;
	const output = new ImageData(width, height);

	// Copy original data
	for (let i = 0; i < data.length; i++) {
		output.data[i] = data[i];
	}

	// Floyd-Steinberg dithering
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;

			// Add noise before quantization
			const noiseR = (Math.random() - 0.5) * 255 * noiseAmount;
			const noiseG = (Math.random() - 0.5) * 255 * noiseAmount;
			const noiseB = (Math.random() - 0.5) * 255 * noiseAmount;

			const oldR = Math.max(0, Math.min(255, output.data[idx] + noiseR));
			const oldG = Math.max(0, Math.min(255, output.data[idx + 1] + noiseG));
			const oldB = Math.max(0, Math.min(255, output.data[idx + 2] + noiseB));

			// Find closest Nord color
			const [newR, newG, newB] = findClosestColor(oldR, oldG, oldB);

			// Set new color
			output.data[idx] = newR;
			output.data[idx + 1] = newG;
			output.data[idx + 2] = newB;
			// Keep alpha channel
			output.data[idx + 3] = data[idx + 3];

			// Calculate error
			const errR = oldR - newR;
			const errG = oldG - newG;
			const errB = oldB - newB;

			// Distribute error to neighboring pixels (Floyd-Steinberg)
			// Right pixel (x+1, y)
			if (x + 1 < width) {
				const rightIdx = (y * width + (x + 1)) * 4;
				output.data[rightIdx] += errR * 7 / 16;
				output.data[rightIdx + 1] += errG * 7 / 16;
				output.data[rightIdx + 2] += errB * 7 / 16;
			}

			// Bottom-left pixel (x-1, y+1)
			if (x > 0 && y + 1 < height) {
				const blIdx = ((y + 1) * width + (x - 1)) * 4;
				output.data[blIdx] += errR * 3 / 16;
				output.data[blIdx + 1] += errG * 3 / 16;
				output.data[blIdx + 2] += errB * 3 / 16;
			}

			// Bottom pixel (x, y+1)
			if (y + 1 < height) {
				const bottomIdx = ((y + 1) * width + x) * 4;
				output.data[bottomIdx] += errR * 5 / 16;
				output.data[bottomIdx + 1] += errG * 5 / 16;
				output.data[bottomIdx + 2] += errB * 5 / 16;
			}

			// Bottom-right pixel (x+1, y+1)
			if (x + 1 < width && y + 1 < height) {
				const brIdx = ((y + 1) * width + (x + 1)) * 4;
				output.data[brIdx] += errR * 1 / 16;
				output.data[brIdx + 1] += errG * 1 / 16;
				output.data[brIdx + 2] += errB * 1 / 16;
			}
		}
	}

	return output;
}
