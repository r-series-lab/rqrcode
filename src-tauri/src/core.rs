use image::{ImageBuffer, ImageReader, Luma};
use qrcode::QrCode;
use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DecodeResult {
    pub content: String,
    pub normalized_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncodeResult {
    pub output_path: String,
    pub size: u32,
}

pub fn normalize_url(value: &str) -> Option<String> {
    let candidate = value.trim();
    if candidate.is_empty() {
        return None;
    }

    let with_protocol = if candidate.starts_with("http://") || candidate.starts_with("https://") {
        candidate.to_string()
    } else if candidate.starts_with("www.") {
        format!("https://{candidate}")
    } else {
        candidate.to_string()
    };

    let parsed = url::Url::parse(&with_protocol).ok()?;
    match parsed.scheme() {
        "http" | "https" => Some(parsed.to_string()),
        _ => None,
    }
}

pub fn encode_qr_to_path(
    content: &str,
    output_path: &Path,
    size: u32,
) -> Result<EncodeResult, String> {
    let normalized = content.trim();
    if normalized.is_empty() {
        return Err("content must not be empty".to_string());
    }

    let code = QrCode::new(normalized.as_bytes()).map_err(|error| error.to_string())?;
    let image: ImageBuffer<Luma<u8>, Vec<u8>> = code
        .render()
        .min_dimensions(size, size)
        .dark_color(Luma([0x17]))
        .light_color(Luma([0xFB]))
        .build();

    if let Some(parent) = output_path.parent() {
        std::fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    image.save(output_path).map_err(|error| error.to_string())?;

    Ok(EncodeResult {
        output_path: absolute_path(output_path).to_string_lossy().to_string(),
        size,
    })
}

pub fn decode_qr_from_path(input_path: &Path) -> Result<DecodeResult, String> {
    let image = ImageReader::open(input_path)
        .map_err(|error| error.to_string())?
        .decode()
        .map_err(|error| error.to_string())?
        .to_luma8();

    let mut prepared = rqrr::PreparedImage::prepare(image);
    let grids = prepared.detect_grids();

    for grid in grids {
        match grid.decode() {
            Ok((_meta, content)) => {
                return Ok(DecodeResult {
                    normalized_url: normalize_url(&content),
                    content,
                });
            }
            Err(_) => continue,
        }
    }

    Err("no QR code detected in the input image".to_string())
}

pub fn absolute_path(path: &Path) -> PathBuf {
    if path.is_absolute() {
        return path.to_path_buf();
    }

    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(path)
}
