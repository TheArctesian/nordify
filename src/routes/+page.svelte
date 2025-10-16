<script lang="ts">
	import { ditherImage } from '$lib/dither';

	let isDragging = $state(false);
	let isProcessing = $state(false);
	let originalImage = $state<string | null>(null);
	let processedImage = $state<string | null>(null);
	let addBorder = $state(false);
	let borderWidth = $state(20);

	async function processImage(file: File) {
		if (!file.type.startsWith('image/')) {
			alert('Please upload an image file');
			return;
		}

		isProcessing = true;
		originalImage = null;
		processedImage = null;

		// Load the image
		const img = new Image();
		const reader = new FileReader();

		reader.onload = (e) => {
			img.src = e.target?.result as string;
		};

		img.onload = () => {
			// Create canvas and get image data
			const canvas = document.createElement('canvas');
			const borderSize = addBorder ? borderWidth : 0;
			canvas.width = img.width + (borderSize * 2);
			canvas.height = img.height + (borderSize * 2);
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				isProcessing = false;
				alert('Canvas not supported');
				return;
			}

			// If border is enabled, fill with Nord black first
			if (addBorder) {
				ctx.fillStyle = 'rgb(46, 52, 64)'; // Nord black (nord0)
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}

			// Draw image at offset if border is enabled
			ctx.drawImage(img, borderSize, borderSize);
			const imageData = ctx.getImageData(borderSize, borderSize, img.width, img.height);

			// Apply dithering with noise
			const dithered = ditherImage(imageData, 0.05);

			// Put the dithered image back on canvas
			ctx.putImageData(dithered, borderSize, borderSize);

			// Convert to data URL
			processedImage = canvas.toDataURL('image/png');
			isProcessing = false;
		};

		reader.readAsDataURL(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			processImage(files[0]);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleFileInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			processImage(files[0]);
		}
	}

	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items;
		if (!items) return;

		for (let i = 0; i < items.length; i++) {
			if (items[i].type.startsWith('image/')) {
				const file = items[i].getAsFile();
				if (file) {
					processImage(file);
					e.preventDefault();
					break;
				}
			}
		}
	}

	async function downloadImage() {
		if (!processedImage) return;

		const link = document.createElement('a');
		link.href = processedImage;
		link.download = 'nordified-image.png';
		link.click();
	}

	async function copyImage() {
		if (!processedImage) return;

		try {
			const response = await fetch(processedImage);
			const blob = await response.blob();
			await navigator.clipboard.write([
				new ClipboardItem({
					[blob.type]: blob
				})
			]);
			alert('Image copied to clipboard!');
		} catch (err) {
			console.error('Failed to copy image:', err);
			alert('Failed to copy image. Try downloading instead.');
		}
	}
</script>

<svelte:window onpaste={handlePaste} />

<main>
	<h1>Nordify</h1>
	<p class="subtitle">Transform your images with Nord color palette dithering</p>

	{#if !processedImage && !isProcessing}
		<div
			class="dropzone"
			class:dragging={isDragging}
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
		>
			<svg
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
				<polyline points="17 8 12 3 7 8"></polyline>
				<line x1="12" y1="3" x2="12" y2="15"></line>
			</svg>
			<p class="dropzone-text">Drag and drop an image here</p>
			<p class="dropzone-subtext">or paste from clipboard</p>

			<div class="options">
				<label class="checkbox-label">
					<input type="checkbox" bind:checked={addBorder} />
					<span>Add border (Nord black)</span>
				</label>

				{#if addBorder}
					<div class="slider-container">
						<label for="border-width">Border width: {borderWidth}px</label>
						<input
							id="border-width"
							type="range"
							min="5"
							max="100"
							step="5"
							bind:value={borderWidth}
						/>
					</div>
				{/if}
			</div>

			<label class="file-button">
				<input type="file" accept="image/*" onchange={handleFileInput} />
				Choose File
			</label>
		</div>
	{/if}

	{#if isProcessing}
		<div class="loading">
			<div class="spinner"></div>
			<p>Processing image...</p>
		</div>
	{/if}

	{#if processedImage && !isProcessing}
		<div class="preview">
			<img src={processedImage} alt="Nordified" />
			<div class="actions">
				<button class="action-button" onclick={downloadImage} title="Download">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="7 10 12 15 17 10"></polyline>
						<line x1="12" y1="15" x2="12" y2="3"></line>
					</svg>
					<span>Download</span>
				</button>
				<button class="action-button" onclick={copyImage} title="Copy to clipboard">
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
						<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
					</svg>
					<span>Copy</span>
				</button>
				<button
					class="action-button secondary"
					onclick={() => {
						processedImage = null;
						originalImage = null;
					}}
				>
					<svg
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polyline points="1 4 1 10 7 10"></polyline>
						<path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
					</svg>
					<span>New Image</span>
				</button>
			</div>
		</div>
	{/if}
</main>

<footer>
	<a href="https://github.com/TheArctesian/nordify" target="_blank" rel="noopener noreferrer" title="View on GitHub">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="currentColor"
		>
			<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
		</svg>
	</a>
	<a href="https://www.stephenokita.com/" target="_blank" rel="noopener noreferrer" title="Visit website">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="10"></circle>
			<line x1="2" y1="12" x2="22" y2="12"></line>
			<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
		</svg>
	</a>
</footer>

<style>
	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	h1 {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: var(--accent-primary);
	}

	.subtitle {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin-bottom: 3rem;
		text-align: center;
	}

	.dropzone {
		border: 2px dashed var(--border-color);
		border-radius: 1rem;
		padding: 4rem 2rem;
		min-width: 500px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		background-color: var(--bg-secondary);
		transition: all 0.2s ease;
		color: var(--text-secondary);
	}

	.dropzone:hover {
		border-color: var(--accent-primary);
		background-color: var(--bg-tertiary);
	}

	.dropzone.dragging {
		border-color: var(--accent-primary);
		background-color: var(--bg-tertiary);
		transform: scale(1.02);
	}

	.dropzone svg {
		opacity: 0.7;
	}

	.dropzone-text {
		font-size: 1.25rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.dropzone-subtext {
		font-size: 1rem;
		color: var(--text-secondary);
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 400px;
		padding: 1rem;
		background-color: var(--bg-primary);
		border-radius: 0.5rem;
		margin-top: 1rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.checkbox-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
		accent-color: var(--accent-primary);
	}

	.slider-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider-container label {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	.slider-container input[type="range"] {
		width: 100%;
		height: 0.5rem;
		background: var(--bg-tertiary);
		border-radius: 0.25rem;
		outline: none;
		cursor: pointer;
	}

	.slider-container input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 1.25rem;
		height: 1.25rem;
		background: var(--accent-primary);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.slider-container input[type="range"]::-webkit-slider-thumb:hover {
		background: var(--accent-secondary);
		transform: scale(1.1);
	}

	.slider-container input[type="range"]::-moz-range-thumb {
		width: 1.25rem;
		height: 1.25rem;
		background: var(--accent-primary);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.slider-container input[type="range"]::-moz-range-thumb:hover {
		background: var(--accent-secondary);
		transform: scale(1.1);
	}

	.file-button {
		margin-top: 1rem;
		padding: 0.75rem 2rem;
		background-color: var(--accent-primary);
		color: var(--bg-primary);
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.file-button:hover {
		background-color: var(--accent-secondary);
		transform: translateY(-2px);
	}

	.file-button input {
		display: none;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		padding: 4rem;
	}

	.loading p {
		font-size: 1.25rem;
		color: var(--text-secondary);
	}

	.spinner {
		width: 60px;
		height: 60px;
		border: 4px solid var(--border-color);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
		width: 100%;
		max-width: 900px;
	}

	.preview img {
		max-width: 100%;
		max-height: 70vh;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
	}

	.actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: var(--accent-primary);
		color: var(--bg-primary);
		border-radius: 0.5rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.action-button:hover {
		background-color: var(--accent-secondary);
		transform: translateY(-2px);
	}

	.action-button.secondary {
		background-color: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.action-button.secondary:hover {
		background-color: var(--bg-secondary);
		border-color: var(--accent-primary);
	}

	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 1.5rem;
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		background: linear-gradient(to top, var(--bg-primary) 0%, var(--bg-primary) 70%, transparent 100%);
	}

	footer a {
		color: var(--text-secondary);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.5rem;
	}

	footer a:hover {
		color: var(--accent-primary);
		transform: translateY(-2px);
	}

	@media (max-width: 640px) {
		.dropzone {
			min-width: unset;
			width: 100%;
			padding: 3rem 1.5rem;
		}

		h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1rem;
		}
	}
</style>
