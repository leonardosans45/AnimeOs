import React, { useEffect } from 'react'; // <--- OJO: Agregué { useEffect }
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Command } from '@tauri-apps/plugin-shell'; // <--- OJO: Importante para ejecutar los EXE

import { BackgroundProvider } from './context/BackgroundContext';
import CyberBackground from './components/Layout/Background/CyberBackground';
import Test from './components/Player/Test.jsx';
import Header from './components/Layout/Header/Header';
import HomeView from './views/HomeView';
import DetailView from './views/DetailView';
import RecognitionView from './views/RecognitionView';
import PlayerView from './views/PlayerView';
import './styles/reset.css';
import './styles/variables.css';
import './styles/glass.css';
import './styles/animations.css';
import './App.css';
import AnimeCursor from './components/AnimeCursor';

function App() {

    // --- BLOQUE DE AUTO-ARRANQUE (NUEVO) ---
    useEffect(() => {
        const startServices = async () => {
            try {
                console.log("🚀 Iniciando servicios en segundo plano...");

                // 1. Iniciar el Scraper (API)
                // Nota: 'binaries/scraper' debe coincidir con lo que pusiste en tauri.conf.json
                const scraper = Command.sidecar('binaries/scraper');
                const scraperProcess = await scraper.spawn();
                console.log(`✅ Scraper activo (PID: ${scraperProcess.pid})`);

                // 2. Iniciar el Proxy (Imágenes)
                const proxy = Command.sidecar('binaries/proxy');
                const proxyProcess = await proxy.spawn();
                console.log(`✅ Proxy activo (PID: ${proxyProcess.pid})`);

            } catch (error) {
                console.error("❌ Error crítico al iniciar los servidores:", error);
            }
        };

        startServices();
    }, []); 
    // ----------------------------------------

    return (
        <>
            <AnimeCursor />
            <BackgroundProvider>
                <Router>
                    <div className="app-container">
                        <CyberBackground />
                        <Header />
                        <main className="main-content">
                            <Test />
                            <Routes>
                                <Route path="/" element={<HomeView />} />
                                <Route path="/anime/:id" element={<DetailView />} />
                                <Route path="/recognize" element={<RecognitionView />} />
                                <Route path="/watch/:id/:episode" element={<PlayerView />} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </BackgroundProvider>
        </>
    );
}

export default App;