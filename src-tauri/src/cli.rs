use crate::core::{decode_qr_from_path, encode_qr_to_path};
use clap::error::ErrorKind;
use clap::{Parser, Subcommand};
use serde::Serialize;
use serde_json::json;
use std::ffi::OsStr;
use std::io::{self, Read};
use std::path::PathBuf;

#[derive(Debug, Parser)]
#[command(name = "rqrcode")]
#[command(about = "A lightweight QR studio for desktop and CLI workflows.")]
pub struct Cli {
    #[arg(long, global = true)]
    pub json: bool,
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Debug, Subcommand)]
pub enum Commands {
    Desktop,
    Info,
    Capabilities,
    #[command(alias = "generate")]
    Encode {
        #[arg(long, alias = "content", value_name = "TEXT")]
        text: Option<String>,
        #[arg(long)]
        stdin: bool,
        #[arg(long)]
        out: PathBuf,
        #[arg(long, default_value_t = 512)]
        size: u32,
    },
    #[command(alias = "recognize")]
    Decode {
        #[arg(long)]
        input: PathBuf,
    },
}

#[derive(Debug)]
pub enum CliOutcome {
    LaunchDesktop,
    Exit(i32),
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    name: &'static str,
    binary: &'static str,
    version: &'static str,
    identifier: &'static str,
    family: &'static str,
    architecture: &'static str,
    default_command: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FlagInfo {
    flag: &'static str,
    description: &'static str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CapabilityInfo {
    command: &'static str,
    aliases: Vec<&'static str>,
    description: &'static str,
    json_supported: bool,
    reads_stdin: bool,
    reads_files: bool,
    writes_files: bool,
    examples: Vec<&'static str>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct CapabilityManifest {
    global_flags: Vec<FlagInfo>,
    commands: Vec<CapabilityInfo>,
}

fn app_info() -> AppInfo {
    AppInfo {
        name: "rQrcode",
        binary: "rqrcode",
        version: env!("CARGO_PKG_VERSION"),
        identifier: "app.rseries.rqrcode",
        family: "r",
        architecture: "simple-tool",
        default_command: "desktop",
    }
}

fn capability_manifest() -> CapabilityManifest {
    CapabilityManifest {
        global_flags: vec![FlagInfo {
            flag: "--json",
            description: "Return a single machine-friendly JSON object.",
        }],
        commands: vec![
            CapabilityInfo {
                command: "desktop",
                aliases: vec![],
                description: "Launch the desktop workspace.",
                json_supported: false,
                reads_stdin: false,
                reads_files: false,
                writes_files: false,
                examples: vec!["rqrcode desktop"],
            },
            CapabilityInfo {
                command: "info",
                aliases: vec![],
                description: "Show app identity and family metadata.",
                json_supported: true,
                reads_stdin: false,
                reads_files: false,
                writes_files: false,
                examples: vec!["rqrcode info --json"],
            },
            CapabilityInfo {
                command: "capabilities",
                aliases: vec![],
                description: "List available CLI operations and usage hints.",
                json_supported: true,
                reads_stdin: false,
                reads_files: false,
                writes_files: false,
                examples: vec!["rqrcode capabilities --json"],
            },
            CapabilityInfo {
                command: "encode",
                aliases: vec!["generate"],
                description: "Generate a QR code PNG from text input.",
                json_supported: true,
                reads_stdin: true,
                reads_files: false,
                writes_files: true,
                examples: vec![
                    "rqrcode encode --text \"https://example.com\" --out /tmp/rqrcode.png --json",
                    "printf 'hello from stdin' | rqrcode encode --stdin --out /tmp/rqrcode.png --json",
                ],
            },
            CapabilityInfo {
                command: "decode",
                aliases: vec!["recognize"],
                description: "Decode a QR code from an image file.",
                json_supported: true,
                reads_stdin: false,
                reads_files: true,
                writes_files: false,
                examples: vec!["rqrcode decode --input /tmp/rqrcode.png --json"],
            },
        ],
    }
}

fn print_info(info: &AppInfo) {
    println!("{} {}", info.name, info.version);
    println!("binary: {}", info.binary);
    println!("identifier: {}", info.identifier);
    println!("family: {}", info.family);
    println!("architecture: {}", info.architecture);
    println!("default command: {}", info.default_command);
}

fn print_capabilities(manifest: &CapabilityManifest) {
    println!("global flags:");
    for flag in &manifest.global_flags {
        println!("  {}: {}", flag.flag, flag.description);
    }

    println!();
    println!("commands:");
    for command in &manifest.commands {
        let alias_suffix = if command.aliases.is_empty() {
            String::new()
        } else {
            format!(" (aliases: {})", command.aliases.join(", "))
        };
        println!("  {}{}", command.command, alias_suffix);
        println!("    {}", command.description);

        if let Some(example) = command.examples.first() {
            println!("    example: {example}");
        }
    }
}

fn print_encode_result(result: &crate::core::EncodeResult) {
    println!("output: {}", result.output_path);
    println!("size: {}", result.size);
}

fn print_decode_result(result: &crate::core::DecodeResult) {
    println!("content: {}", result.content);
    if let Some(url) = &result.normalized_url {
        println!("normalized url: {url}");
    }
}

pub fn run_from_env() -> CliOutcome {
    let raw_args: Vec<_> = std::env::args_os().collect();
    let wants_json = raw_args.iter().any(|arg| arg == OsStr::new("--json"));
    let cli = match Cli::try_parse_from(raw_args) {
        Ok(cli) => cli,
        Err(error) => return emit_parse_error(wants_json, error),
    };

    match cli.command {
        None | Some(Commands::Desktop) => CliOutcome::LaunchDesktop,
        Some(Commands::Info) => {
            let info = app_info();
            emit_success(cli.json, "info", &info);
            if !cli.json {
                print_info(&info);
            }
            CliOutcome::Exit(0)
        }
        Some(Commands::Capabilities) => {
            let manifest = capability_manifest();
            emit_success(cli.json, "capabilities", &manifest);
            if !cli.json {
                print_capabilities(&manifest);
            }
            CliOutcome::Exit(0)
        }
        Some(Commands::Encode {
            text,
            stdin,
            out,
            size,
        }) => {
            let resolved_content = match resolve_content(text, stdin) {
                Ok(value) => value,
                Err(message) => return emit_error(cli.json, "invalid_arguments", &message, 2),
            };

            if size == 0 {
                return emit_error(
                    cli.json,
                    "invalid_arguments",
                    "size must be greater than zero",
                    2,
                );
            }

            match encode_qr_to_path(&resolved_content, &out, size) {
                Ok(result) => {
                    emit_success(cli.json, "encode", &result);
                    if !cli.json {
                        print_encode_result(&result);
                    }
                    CliOutcome::Exit(0)
                }
                Err(message) => emit_error(cli.json, "encode_failed", &message, 1),
            }
        }
        Some(Commands::Decode { input }) => {
            if !input.exists() {
                return emit_error(cli.json, "not_found", "input image does not exist", 3);
            }

            match decode_qr_from_path(&input) {
                Ok(result) => {
                    emit_success(cli.json, "decode", &result);
                    if !cli.json {
                        print_decode_result(&result);
                    }
                    CliOutcome::Exit(0)
                }
                Err(message) => emit_error(cli.json, "decode_failed", &message, 4),
            }
        }
    }
}

fn resolve_content(text: Option<String>, stdin: bool) -> Result<String, String> {
    match (text, stdin) {
        (Some(value), false) => Ok(value),
        (None, true) => {
            let mut buffer = String::new();
            io::stdin()
                .read_to_string(&mut buffer)
                .map_err(|error| error.to_string())?;
            if buffer.trim().is_empty() {
                Err("stdin did not contain any content".to_string())
            } else {
                Ok(buffer)
            }
        }
        (Some(_), true) => Err("use either --text or --stdin, not both".to_string()),
        (None, false) => Err("text is required unless --stdin is used".to_string()),
    }
}

fn emit_success<T: Serialize>(json_output: bool, command: &str, data: T) {
    if json_output {
        let payload = json!({
            "ok": true,
            "command": command,
            "data": data,
        });
        println!("{}", serde_json::to_string_pretty(&payload).unwrap());
    }
}

fn emit_error(json_output: bool, code: &str, message: &str, exit_code: i32) -> CliOutcome {
    if json_output {
        let payload = json!({
            "ok": false,
            "error": {
                "code": code,
                "message": message,
            }
        });
        println!("{}", serde_json::to_string_pretty(&payload).unwrap());
    } else {
        eprintln!("{message}");
    }

    CliOutcome::Exit(exit_code)
}

fn emit_parse_error(json_output: bool, error: clap::Error) -> CliOutcome {
    let kind = error.kind();
    let message = error.to_string().trim().to_string();

    if json_output {
        if matches!(
            kind,
            ErrorKind::DisplayHelp | ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand
        ) {
            let payload = json!({
                "ok": true,
                "command": "help",
                "data": {
                    "message": message,
                }
            });
            println!("{}", serde_json::to_string_pretty(&payload).unwrap());
            return CliOutcome::Exit(0);
        }

        if kind == ErrorKind::DisplayVersion {
            let payload = json!({
                "ok": true,
                "command": "version",
                "data": {
                    "message": message,
                }
            });
            println!("{}", serde_json::to_string_pretty(&payload).unwrap());
            return CliOutcome::Exit(0);
        }

        let payload = json!({
            "ok": false,
            "error": {
                "code": "invalid_arguments",
                "message": message,
            }
        });
        println!("{}", serde_json::to_string_pretty(&payload).unwrap());
        return CliOutcome::Exit(2);
    }

    let exit_code = if matches!(
        kind,
        ErrorKind::DisplayHelp
            | ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand
            | ErrorKind::DisplayVersion
    ) {
        0
    } else {
        2
    };

    let _ = error.print();
    CliOutcome::Exit(exit_code)
}
