AnimeOS
> AnimeOS is an anime entertainment experience featuring a nostalgic Y2K Cybercore aesthetic. Built over a short personal development timeframe with the help of AI, using React + Vite, and compiled for desktop with Tauri and Node sidecars.

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
1. Navigate to the following path in this repository:
   animeos/src-tauri/target/release/bundle/
2. Inside that folder, choose the installation type you prefer (e.g., .msi or .exe).
3. Download the file, run the installer, and start watching!

(Note: If the app doesn't load episodes the first time, try running it as Administrator or simply restart the app).

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
* Consumet: Massive thanks to the Consumet project for providing the robust scraping ecosystem that makes media streaming possible.
* AniList: Thanks to the AniList database and community for providing the essential metadata structure for anime tracking.
