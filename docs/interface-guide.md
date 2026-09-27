# rQrcode 界面与公开演示说明

rQrcode 在本机生成和识别二维码，不依赖在线二维码服务。公开截图只使用 `example.com` 这一合成域名，不包含真实链接、账号或文件。

## 生成工作区

![rQrcode 生成工作区](assets/screenshots/rqrcode-generate.png)

生成页由输入区、二维码预览、导出操作和最近记录组成：

- 输入文本或 URL 后，预览区即时生成二维码。
- `保存` 将当前内容加入本地历史；`复制` 只复制当前文本。
- `导出 PNG` 由用户明确选择输出位置，应用不会自动上传图片。
- 切换到“识别”后，可以选择、拖入或粘贴二维码图片。

截图中的输入值为 `https://example.com`，二维码和空的最近记录均为公开演示数据。

## CLI 演示边界

```bash
cargo run --manifest-path ./src-tauri/Cargo.toml -- \
  encode --text "https://example.com" --out /tmp/rqrcode-demo.png --json
```

识别流程只读取用户显式传入的图片；公开文档、截图和 Issue 不应包含真实二维码、私有 URL 或个人文件。

## 公开截图规则

- 使用 `example.com`、`/tmp/rqrcode-demo.png` 和仓库内置 fixture。
- 发布前检查二维码是否指向测试域名，最近记录是否为空或为合成数据。
- 截图来自本地 web 预览，不代表上传或在线识别，也不是 Playwright 或冒烟测试结果。

相关入口：[README](../README.md)、[公开仓库边界](../PUBLIC_REPOSITORY.md)、[安全报告](../SECURITY.md)、[发布说明](../RELEASE.md)。
