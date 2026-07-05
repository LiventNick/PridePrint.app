<p align="center">
  <img src="printtools.svg" alt="PridePrint.app Logo" width="128" />
</p>

# Nick's Pride Print Shop

A client-side suite of PDF tools designed specifically for print shop workflows. It operates entirely in the browser, meaning files are processed securely on your machine without being uploaded to any external servers.

## Tools Included

### 1. Poster Optimizer
A dedicated tool to prepare Canva "PDF Print" exports for regular office printers.
- **1-up (Standard):** Scales the poster down slightly to ensure the printer's natural margins do not cut off the artwork.
- **2-up (Side-by-Side):** Perfectly places two posters next to each other on a single landscape sheet of letter paper.
- **Advanced Rasterization:** Bypasses vector rendering glitches (such as white hairlines between Canva shapes) by completely flattening the PDF at ~300 DPI prior to scaling.

### 2. Button Printer
A tool designed to generate print-ready sheets for physical button makers. 
- **Intelligent Centering:** Automatically center-crops uploaded photos (regardless of their dimensions) into perfect squares to prevent stretching.
- **High-Visibility Punch Guides:** Automatically draws a unique, dual-stroke (black and white) circular cut line around every button so you can perfectly align your graphic punch regardless of the photo's background color.
- **Dynamic Packing:** Automatically calculates maximum rows and columns to perfectly pack buttons onto your chosen paper size (Letter, A4, or Legal).

## Tech Stack
- **Framework:** React + Vite
- **Language:** TypeScript
- **Routing:** React Router DOM
- **PDF Generation:** `pdf-lib`
- **PDF Rasterization:** `pdfjs-dist`
- **Styling:** Vanilla CSS (Modern glassmorphism and dark mode)
- **Icons:** `lucide-react`
- **Drag & Drop:** `@dnd-kit`

## Local Development

To run this project on your local machine:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Cloudflare Pages Deployment

This app is designed to be easily deployed as a static site using Cloudflare Pages.

1. Push this repository to GitHub.
2. Go to your Cloudflare Dashboard -> **Pages**.
3. Click **Connect to Git** and select your repository.
4. Use the following build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. Cloudflare will automatically build and host the application.
