// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    match rqrcode_lib::cli::run_from_env() {
        rqrcode_lib::cli::CliOutcome::LaunchDesktop => rqrcode_lib::run(),
        rqrcode_lib::cli::CliOutcome::Exit(code) => std::process::exit(code),
    }
}
