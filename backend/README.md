# Express + TypeScript + Node.js Backend

This is a basic setup for a Node.js backend using Express and TypeScript.

## Scripts
- `npm run dev` — Start the server in development mode with watch (auto-restart on changes)
- `npm run build` — Compile TypeScript to JavaScript
- `npm start` — Run the compiled JavaScript from `dist`

## Development
- Source code is in `src/`
- Compiled code is output to `dist/`

## Getting Started
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start in development mode:
   ```sh
   npm run dev
   ```
3. Build for production:
   ```sh
   npm run build
   ```
4. Start production server:
   ```sh
   npm start
   ```

## Watch Mode
- Uses `ts-node-dev` for fast restarts and TypeScript support during development.
