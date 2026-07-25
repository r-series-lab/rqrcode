use serde_json::Value;
use std::path::PathBuf;
use std::process::{Command, Output, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

fn binary_path() -> &'static str {
    env!("CARGO_BIN_EXE_rqrcode")
}

fn run_cli(args: &[&str]) -> Output {
    Command::new(binary_path())
        .args(args)
        .output()
        .expect("failed to run rqrcode binary")
}

fn run_cli_with_stdin(args: &[&str], stdin: &str) -> Output {
    let mut child = Command::new(binary_path())
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("failed to spawn rqrcode binary");

    {
        let input = child.stdin.as_mut().expect("stdin not available");
        std::io::Write::write_all(input, stdin.as_bytes()).expect("failed to write stdin");
    }

    child
        .wait_with_output()
        .expect("failed to read rqrcode output")
}

fn parse_stdout_json(output: &Output) -> Value {
    serde_json::from_slice(&output.stdout).expect("stdout should contain valid json")
}

fn unique_temp_png() -> PathBuf {
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock drift")
        .as_nanos();
    std::env::temp_dir().join(format!("rqrcode-cli-{stamp}.png"))
}

#[test]
fn info_json_returns_family_metadata() {
    let output = run_cli(&["info", "--json"]);
    assert_eq!(output.status.code(), Some(0));

    let payload = parse_stdout_json(&output);
    assert_eq!(payload["ok"], true);
    assert_eq!(payload["command"], "info");
    assert_eq!(payload["data"]["name"], "rQrcode");
    assert_eq!(payload["data"]["binary"], "rqrcode");
    assert_eq!(payload["data"]["architecture"], "simple-tool");
}

#[test]
fn capabilities_json_lists_core_commands_and_aliases() {
    let output = run_cli(&["capabilities", "--json"]);
    assert_eq!(output.status.code(), Some(0));

    let payload = parse_stdout_json(&output);
    assert_eq!(payload["ok"], true);
    assert_eq!(payload["command"], "capabilities");

    let commands = payload["data"]["commands"]
        .as_array()
        .expect("commands should be an array");

    let encode = commands
        .iter()
        .find(|item| item["command"] == "encode")
        .expect("encode command should exist");
    assert_eq!(encode["jsonSupported"], true);
    assert_eq!(encode["writesFiles"], true);
    assert_eq!(encode["aliases"][0], "generate");

    let decode = commands
        .iter()
        .find(|item| item["command"] == "decode")
        .expect("decode command should exist");
    assert_eq!(decode["readsFiles"], true);
    assert_eq!(decode["aliases"][0], "recognize");
}

#[test]
fn encode_then_decode_round_trip_with_json() {
    let output_path = unique_temp_png();
    let output_path_string = output_path.to_string_lossy().to_string();

    let encode_output = run_cli(&[
        "encode",
        "--text",
        "https://example.com",
        "--out",
        &output_path_string,
        "--json",
    ]);
    assert_eq!(encode_output.status.code(), Some(0));

    let encode_payload = parse_stdout_json(&encode_output);
    assert_eq!(encode_payload["ok"], true);
    assert_eq!(encode_payload["command"], "encode");
    assert_eq!(encode_payload["data"]["outputPath"], output_path_string);
    assert!(output_path.exists(), "encoded output should exist");

    let decode_output = run_cli(&["decode", "--input", &output_path_string, "--json"]);
    assert_eq!(decode_output.status.code(), Some(0));

    let decode_payload = parse_stdout_json(&decode_output);
    assert_eq!(decode_payload["ok"], true);
    assert_eq!(decode_payload["command"], "decode");
    assert_eq!(decode_payload["data"]["content"], "https://example.com");
    assert_eq!(
        decode_payload["data"]["normalizedUrl"],
        "https://example.com/"
    );

    let _ = std::fs::remove_file(output_path);
}

#[test]
fn encode_rejects_text_and_stdin_together() {
    let output_path = unique_temp_png();
    let output_path_string = output_path.to_string_lossy().to_string();

    let output = run_cli_with_stdin(
        &[
            "encode",
            "--text",
            "hello",
            "--stdin",
            "--out",
            &output_path_string,
            "--json",
        ],
        "stdin payload",
    );

    assert_eq!(output.status.code(), Some(2));
    let payload = parse_stdout_json(&output);
    assert_eq!(payload["ok"], false);
    assert_eq!(payload["error"]["code"], "invalid_arguments");
}

#[test]
fn decode_missing_file_returns_not_found_json() {
    let missing_path = unique_temp_png();
    let missing_path_string = missing_path.to_string_lossy().to_string();

    let output = run_cli(&["decode", "--input", &missing_path_string, "--json"]);
    assert_eq!(output.status.code(), Some(3));

    let payload = parse_stdout_json(&output);
    assert_eq!(payload["ok"], false);
    assert_eq!(payload["error"]["code"], "not_found");
}
