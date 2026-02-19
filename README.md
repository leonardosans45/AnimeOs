AnimeOS
> AnimeOS is an anime entertainment experience featuring a nostalgic Y2K Cybercore aesthetic. Built over a short personal development timeframe with the help of AI, using React + Vite, and compiled for desktop with Tauri and Node sidecars.

<img width="1366" height="768" alt="Captura de pantalla 2025-12-31 231136" src="https://github.com/user-attachments/assets/aba1c57b-f712-4c42-b795-1cd4fe5b2ad8" />

<img width="1366" height="768" alt="Captura de pantalla 2025-12-31 231928" src="https://github.com/user-attachments/assets/6ddd865d-fa20-4cba-ab89-b5491f1db984" />

<img width="1366" height="768" alt="Captura de pantalla 2025-12-31 142412" src="https://github.com/user-attachments/assets/14f41109-8f6a-4a7c-ba0e-35f5521bd144" />

The Story Behind AnimeOS (Vibe Coding)
This project was built from scratch in just 2 to 3 weeks during a winter vacation. 

It serves as a personal experiment in AI-Assisted Development (Vibe Coding). While AI generated individual code blocks, the core challenge was orchestrating the system architecture: integrating a React Frontend with compiled Node.js backend sidecars inside a lightweight Tauri environment, and solving OS-level permission constraints natively in Windows. 

It proves that rapid, highly-customized development is possible when you combine AI power with human architectural logic.

Architecture: Local-First & Privacy Focused
Unlike traditional web-apps wrapped in heavy desktop shells (like Electron), AnimeOS embraces a Local-First, No-Auth architecture:
* Zero Friction: No logins, no accounts, no cloud syncing. 
* High Performance: It utilizes lightweight NoSQL local storage for zero-latency history and favorites.
* Privacy by Design: All data stays on the user's machine (AppData), respecting privacy and eliminating the overhead of managing databases.

Installation (No Cloning Required!)
You don't need to clone this repository, install dependencies, or touch any code to use the app. 

To simply install and enjoy AnimeOS:
1. Go to https://github.com/leonardosans45/AnimeOs/releases.
2. Download the latest installer file (.msi or .exe).
3. Run the installer and start watching!

Important Notice:
Always run this application as Administrator, or configure the executable's properties to run as Administrator automatically. This is strictly required for the internal backend sidecars to function properly and load episodes.
Known Bugs & Future Updates
Disclaimer: This is a v1.0 release built rapidly during a vacation period. It currently contains some known bugs and leftover code that have already been identified. 

Upcoming in v2.0:
* Comprehensive bug fixes and code cleanup.
* Full dynamic theming system (featuring other Touhou characters like Remilia).
* Removal of any need for Administrator privileges.

Tech Stack
* Frontend: React + Vite + Tailwind CSS / Custom CSS
* Desktop Framework: Tauri (Rust / WebView2)
* Backend / Sidecars: Node.js (Packaged via pkg)
* Aesthetic: Y2K / Cybercore / Touhou Project (Flandre Scarlet)

Credits & Acknowledgements
* Touhou Project: Characters and universe created by ZUN / Team Shanghai Alice. This is a non-commercial, fan-made UI experiment and is not affiliated with official Touhou Project releases.
* Background Art: All rights reserved to the respective original artist of the wallpaper used in the application.
* Custom Cursor: Flandre Scarlet cursor design and assets provided by the creator. Support their amazing work here: https://ko-fi.com/s/84f5c0ff32
* Consumet: Massive thanks to the Consumet project for providing the robust scraping ecosystem that makes media streaming possible.
* AniList: Thanks to the AniList database and community for providing the essential metadata structure for anime tracking.
