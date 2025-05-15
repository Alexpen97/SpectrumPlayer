#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Window};
use std::fs;
use std::path::Path;

// This function is called when Tauri is ready
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            
            // You can initialize any app-specific setup here
            println!("Tauri application started");
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            window_control,
            get_app_version,
            get_local_storage_item,
            set_local_storage_item,
            remove_local_storage_item,
            check_file_exists,
            create_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Window control command for custom title bar
#[tauri::command]
fn window_control(window: Window, command: &str) -> Result<(), String> {
    match command {
        "minimize" => {
            window.minimize().map_err(|e| e.to_string())?;
        }
        "maximize" => {
            if window.is_maximized().map_err(|e| e.to_string())? {
                window.unmaximize().map_err(|e| e.to_string())?;
            } else {
                window.maximize().map_err(|e| e.to_string())?;
            }
        }
        "close" => {
            window.close().map_err(|e| e.to_string())?;
        }
        _ => return Err(format!("Unknown command: {}", command)),
    }
    Ok(())
}

// Get application version
#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Local storage commands to maintain compatibility with Electron
#[tauri::command]
fn get_local_storage_item(key: String) -> Option<String> {
    // In a real implementation, you would use a persistent storage solution
    // For now, we'll return None to indicate the item doesn't exist
    None
}

#[tauri::command]
fn set_local_storage_item(key: String, value: String) -> Result<(), String> {
    // In a real implementation, you would store this value
    Ok(())
}

#[tauri::command]
fn remove_local_storage_item(key: String) -> Result<(), String> {
    // In a real implementation, you would remove this value
    Ok(())
}

// File system commands
#[tauri::command]
fn check_file_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(path)
        .map_err(|e| e.to_string())
}
