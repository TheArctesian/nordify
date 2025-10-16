# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nordify is a web application that transforms images using the Nord color palette through Floyd-Steinberg dithering. Users can upload images via drag-and-drop, file selection, or clipboard paste, and the app converts them to use only the 16 colors of the Nord theme with optional borders.

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5 (runes API)
- **Language**: TypeScript with strict mode enabled
- **Build Tool**: Vite
- **Adapter**: Vercel adapter for deployment
- **Analytics**: Vercel Analytics

## Development Commands

```bash
# Start development server
npm run dev

# Open development server in browser
npm run dev -- --open

# Build for production
npm run build

# Preview production build
npm run preview

# Type-check
npm run check

# Type-check in watch mode
npm run check:watch

# Format code (Prettier)
npm run format

# Check formatting
npm run lint
```

## Architecture

### Core Image Processing

The dithering algorithm is in `src/lib/dither.ts`:
- Uses Floyd-Steinberg error diffusion dithering
- Quantizes images to the 16-color Nord palette (4 Polar Night, 3 Snow Storm, 4 Frost, 5 Aurora colors)
- Applies configurable noise before quantization for texture
- Color matching uses Euclidean distance in RGB space

### Application Structure

- `src/routes/+page.svelte`: Main application UI with drag-and-drop, file upload, and image processing
- `src/routes/+layout.svelte`: Root layout with analytics injection and favicon
- `src/app.css`: Nord color palette CSS variables and global styles
- `src/lib/dither.ts`: Core dithering algorithm

### Svelte 5 Patterns

This codebase uses Svelte 5's new runes API:
- `$state()` for reactive state instead of `let` declarations
- `$props()` for component props instead of `export let`
- `@render` for rendering children instead of `<slot>`
- Event handlers use `on*` attributes (e.g., `onclick`, `ondrop`)

### Nord Color System

Colors are defined in `app.css` with semantic aliases:
- Background colors: `--bg-primary` (nord0), `--bg-secondary` (nord1), `--bg-tertiary` (nord2)
- Text colors: `--text-primary` (nord6), `--text-secondary` (nord4)
- Accent colors: `--accent-primary` (nord8), `--accent-secondary` (nord9)
- Border: `--border-color` (nord3)

## Key Features

1. **Multiple Input Methods**: Drag-and-drop, file selection, and clipboard paste
2. **Optional Borders**: Configurable width (5-100px) in Nord black (nord0)
3. **Image Export**: Download as PNG or copy directly to clipboard
4. **Responsive Design**: Mobile-friendly with adaptive layouts
