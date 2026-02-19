use tauri_plugin_shell::ShellExt; // 👈 Importante: Necesario para que funcione .sidecar()

// Tu comando original (se mantiene intacto)
#[tauri::command]
fn force_close_app() {
    std::thread::spawn(|| {
        std::thread::sleep(std::time::Duration::from_millis(50));
        std::process::exit(0);
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![force_close_app]) // Tu handler original
        .setup(|app| {
            // 1. Tu lógica de logs original (se mantiene)
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // 2. 🔥 CÓDIGO NUEVO: Arrancar los servidores (Sidecars) 🔥
            
            // Encender Proxy
            let proxy = app.shell().sidecar("proxy").unwrap();
            let (mut _rx, _child) = proxy.spawn().expect("Error al iniciar Proxy");
            println!("✅ Proxy iniciado correctamente");

            // Encender Scraper
            let scraper = app.shell().sidecar("scraper").unwrap();
            let (mut _rx, _child) = scraper.spawn().expect("Error al iniciar Scraper");
            println!("✅ Scraper iniciado correctamente");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}