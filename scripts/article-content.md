# Windows 下 CLI 工具中文乱码问题终极指南

> 从 cmd 到 PowerShell 7，一次搞懂 Windows 编码那些事

## 前言

如果你是 Windows 用户，在使用现代 CLI 工具时几乎一定会遇到这样的场景：

```bash
$ codex ask "如何解决中文乱码"
→   Î´ÕÒµ½ÓÐ¹Ø×Ö·û±àÂëµÄÐÅÏ¢
```

或者在使用 AI 编程工具时：

```bash
$ claude "解释这段代码"
→   ½âÊÍÕâ¶Î´úÂëÊ±³öÏÖÁËÂÒÂë
```

这些乱码不是工具的 bug，而是 Windows 终端编码体系与现代 CLI 工具预期之间的根本性冲突。本文将从历史渊源、技术原理、实际解决方案三个维度，彻底讲清这个问题。

---

## 一、问题现象

### 1.1 受影响的工具

这不是 Codex 独有的问题，几乎所有基于 Node.js 的现代 CLI 工具都会受影响：

| 工具类型 | 代表工具 | 乱码表现 |
|---------|---------|---------|
| AI 编程工具 | Codex, Claude, Cursor, Aider | 中文响应乱码 |
| 包管理器 | npm, pnpm, yarn, bun | 错误信息乱码 |
| 开发工具 | webpack, vite, ts-node | 编译输出乱码 |
| 脚手架 | create-react-app, nest-cli | 交互提示乱码 |

### 1.2 典型症状

```powershell
# npm install 失败时的中文错误
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR!
npm ERR! While:_yes???
```

原意是"解决依赖冲突"，但显示为不可读字符。

---

## 二、背景知识：Windows 编码简史

### 2.1 DOS 时代的代码页设计

1980年代，Microsoft 在设计 DOS 时面临一个全球化难题：不同国家使用不同的字符集。解决方案是"代码页"（Code Page）机制——每个地区使用一个编号的字符编码表：

```
Code Page 437  → 美国（英语）
Code Page 936  → 中国（GBK/GB2312）
Code Page 950  → 台湾（Big5）
Code Page 932  → 日本（Shift-JIS）
```

这种设计的优点是兼容性好，缺点是**无法同时显示多种语言**。

### 2.2 GBK/936 的由来

中国大陆的代码页 936 实现的是 GBK 编码：

- GBK = "国标扩展"（GuoBiao Kuozhan）
- 兼容 GB2312，支持 21000+ 汉字
- 双字节编码，常用汉字首字节在 0x81-0xFE 范围

这就是 Windows 终端默认使用 GBK 的历史原因。

### 2.3 Unicode 和 UTF-8 的出现

1991年 Unicode 诞生，目标是给世界上所有字符分配唯一编号。UTF-8 是 Unicode 的一种实现方式：

- 变长编码（1-4字节）
- 完全兼容 ASCII
- 互联网事实标准

现代操作系统和工具都默认 UTF-8，**除了 Windows 终端**。

### 2.4 Windows 的历史包袱

Windows 的困境：

- GUI 部分（资源管理器、记事本等）早已 Unicode 化
- CLI 部分（cmd、PowerShell 5.1）为兼容旧软件，默认仍用代码页

这导致了著名的"Windows 双轨制"：

```
Windows GUI  →  Unicode (UTF-16)
Windows CLI  →  Code Page (936/GBK)
```

---

## 三、技术原理：为什么会出现乱码

### 3.1 编码链路图解

当你在 Windows 终端运行一个 Node.js CLI 工具时，数据流动如下：

```
┌─────────────────────────────────────────────────────────────┐
│  应用层                                                     │
│  Node.js CLI 输出中文字符串 "测试"                           │
│  内部表示: Buffer <e6 b5 8b e8 af 95> (UTF-8)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  系统层                                                     │
│  Windows Console (Active Code Page: 936/GBK)               │
│  按 GBK 解析 UTF-8 字节 → 错误映射                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  显示层                                                     │
│  终端显示乱码: "²âÊÔ"                                        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 UTF-8 vs GBK 编码差异

以"测试"为例：

| 字符 | Unicode | UTF-8 字节 | GBK 字节 |
|------|---------|-----------|---------|
| 测 | U+6D4B | E6 B5 8B | B2 E2 |
| 试 | U+8BD5 | E8 AF 95 | CA FD |

当 UTF-8 字节被错误地按 GBK 解析：
- `E6 B5` → GBK 字符 `²`
- `8B` → 单独无法成字，显示为垃圾字符

### 3.3 CodePage 65001 的意义

65001 是 Windows 对 UTF-8 的代码页编号：

```powershell
# 查看当前代码页
chcp
# 活动代码页: 936

# 切换到 UTF-8
chcp 65001
# 活动代码页: 65001
```

但 `chcp 65001` 只是**临时**方案，重启终端失效。

### 3.4 Node.js 的编码假设

Node.js 从设计之初就假设：

```javascript
// Node.js 内部逻辑
process.stdout.write('中文');  // 假设终端支持 UTF-8
```

因为 Linux/macOS 全链路 UTF-8，这个假设在 *nix 系统完全成立。但在 Windows 默认终端中会出错。

---

## 四、三种终端工具深度对比

### 4.1 cmd.exe

```cmd
C:\> echo %CMDEXTVERSION%
2
```

| 属性 | 值 |
|------|-----|
| 诞生年代 | 1980年代 |
| 基础架构 | DOS 遗产，原生 Win32 API |
| 默认编码 | 继承系统代码页（通常 936） |
| UTF-8 支持 | 需 `chcp 65001`，临时生效 |
| 现代特性 | 无 |
| 推荐使用 | **否** |

**结论**: cmd 仅作为兼容层存在，不适合现代开发工作流。

### 4.2 Windows PowerShell 5.1

```powershell
PS C:\> $PSVersionTable

Name                           Value
----                           -----
PSVersion                      5.1.19041.2311
PSEdition                      Desktop
PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0...}
BuildVersion                   10.0.19041.2311
CLRVersion                     4.0.30319.42000
WSManStackVersion              3.0
PSRemotingProtocolVersion      2.3
SerializationVersion           1.1.0.1
```

| 属性 | 值 |
|------|-----|
| 诞生年代 | 2006年 |
| 基础架构 | .NET Framework |
| 默认编码 | 继承旧控制台编码 |
| UTF-8 支持 | 可配置，但默认仍是代码页 |
| 更新状态 | 随 Windows，不会独立升级 |
| 推荐使用 | **否** |

**结论**: PowerShell 5.1 是系统管理遗产，面向 IT 管理员而非开发者。

### 4.3 PowerShell 7 (pwsh)

```powershell
PS C:\> $PSVersionTable

Name                           Value
----                           -----
PSVersion                      7.4.2
PSEdition                      Core
GitCommitId                    7.4.2
OS                             Microsoft Windows 10.0.19045
Platform                       Win32NT
PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0...}
PSRemotingProtocolVersion      2.3
SerializationVersion           1.1.0.1
WSManStackVersion              3.0
```

| 属性 | 值 |
|------|-----|
| 诞生年代 | 2020年（开源重写） |
| 基础架构 | .NET Core/.NET（跨平台） |
| 默认编码 | 可控 UTF-8 |
| UTF-8 支持 | 原生支持，配置持久化 |
| 跨平台 | Windows/Linux/macOS |
| 更新状态 | 独立更新，快速迭代 |
| 推荐使用 | **是** |

**结论**: pwsh 是面向现代开发者的终端，行为在所有平台上保持一致。

### 4.4 对比总结

| 特性 | cmd | PowerShell 5.1 | PowerShell 7 |
|------|-----|----------------|--------------|
| 定位 | 兼容层 | 系统管理遗产 | 现代开发者终端 |
| 基础架构 | DOS 遗产 | .NET Framework | .NET Core |
| 默认编码 | 继承代码页 | 继承旧控制台 | 可配置 UTF-8 |
| 跨平台 | 否 | 否 | 是 |
| 模块化 | 否 | 有限 | 完整 |
| 管道处理 | 文本 | 对象 | 对象 |
| 推荐使用 | ❌ | ❌ | ✅ |

---

## 五、为什么 Linux/Mac 没这个问题

### 5.1 Linux 的 UTF-8 统一生态

```bash
# 查看 Linux locale
$ locale
LANG=en_US.UTF-8
LANGUAGE=en_US:en
LC_ALL=en_US.UTF-8
LC_CTYPE="en_US.UTF-8"
```

Linux 从 1990年代末开始就全面拥抱 UTF-8：

- 内核支持 UTF-8
- 文件系统默认 UTF-8
- 所有 Shell 默认 UTF-8
- 终端模拟器默认 UTF-8

### 5.2 locale 配置体系

Linux 通过 `locale` 系统统一管理编码：

```bash
# /etc/locale.conf 示例
LANG=zh_CN.UTF-8
LC_CTYPE=zh_CN.UTF-8
```

这种设计确保了全链路编码一致性。

### 5.3 macOS 的情况

macOS 基于 Darwin（BSD 变种），继承了 Unix 传统：

- Terminal.app 默认 UTF-8
- zsh/bash 默认 UTF-8
- 全系统 Unicode 化

### 5.4 Windows GUI 与 CLI 的割裂

```
Windows 世界的分裂：

GUI 世界                     CLI 世界
─────────                   ─────────
记事本           →        cmd.exe
资源管理器        →        PowerShell 5.1
浏览器                        →        legacy apps
├───────────────┬───────────────┤
               │
            Unicode         Code Page
            (UTF-16)        (GBK/936)
```

这种分裂是历史包袱，也是 Windows 终端乱码问题的根源。

---

## 六、终极解决方案

### Step 1: 安装 PowerShell 7

#### 方法一：使用 winget（推荐）

```powershell
winget install --id Microsoft.PowerShell --accept-package-agreements --accept-source-agreements
```

#### 方法二：手动下载

访问 [GitHub Releases](https://github.com/PowerShell/PowerShell/releases) 下载最新版本。

#### 验证安装

```powershell
# 打开新的 PowerShell 7
pwsh

# 验证版本
pwsh --version
# 输出: PowerShell 7.4.2

# 确认是 Core 版本
$PSVersionTable.PSEdition
# 输出: Core
```

### Step 2: 配置 UTF-8 编码

#### 2.1 创建 Profile 文件

PowerShell Profile 是每次启动时自动执行的脚本，类似 `.bashrc`。

```powershell
# 检查 Profile 是否存在
Test-Path $PROFILE
# 输出: False (如果不存在)

# 创建 Profile
New-Item -ItemType File -Path $PROFILE -Force
```

Profile 位置通常在：

```
Windows: C:\Users\<用户>\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
Linux:   ~/.config/powershell/Microsoft.PowerShell_profile.ps1
macOS:   ~/.config/powershell/Microsoft.PowerShell_profile.ps1
```

#### 2.2 编辑 Profile

```powershell
# 用记事本打开（Windows）
notepad $PROFILE

# 或用 VS Code
code $PROFILE
```

#### 2.3 添加 UTF-8 配置

将以下内容复制到 Profile 中：

```powershell
# ============================================
# PowerShell 7 UTF-8 配置
# ============================================

# 设置控制台输入/输出编码为 UTF-8
[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding           = [System.Text.UTF8Encoding]::new()

# 设置环境变量
$env:LANG = "zh_CN.UTF-8"
$env:LC_ALL = "zh_CN.UTF-8"

# Node.js 相关
$env:NODE_OPTIONS = "--max-old-space-size=4096"

# Git 中文支持（如果使用 Git）
$env:LESSCHARSET = "utf-8"

# 显示欢迎信息
Write-Host "✓ PowerShell 7 UTF-8 环境已加载" -ForegroundColor Green
Write-Host "  CodePage: $([Console]::OutputEncoding.CodePage)" -ForegroundColor Cyan
```

保存并关闭。

### Step 3: 验证配置

完全关闭 PowerShell 7，然后重新打开：

```powershell
# 验证代码页
[Console]::OutputEncoding.CodePage
# 输出: 65001

# 验证 PSEdition
$PSVersionTable.PSEdition
# 输出: Core

# 测试中文输出
Write-Host "测试中文输出 ✓ 你好世界 🌍"
# 应该正确显示中文
```

### Step 4: VS Code 配置

#### 4.1 设置默认终端

1. 打开 VS Code
2. 按 `Ctrl+Shift+P` 打开命令面板
3. 输入 `Terminal: Select Default Profile`
4. 选择 `PowerShell`（注意图标是 pwsh，不是 PS5.1）

#### 4.2 settings.json 配置（可选）

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell",
      "args": ["-NoLogo"]
    }
  }
}
```

#### 4.3 验证 VS Code 终端

在 VS Code 中新建终端：

```powershell
PS C:\> $PSVersionTable.PSEdition
Core
```

如果输出 `Core`，说明 VS Code 正在使用 pwsh。

---

## 七、Windows 系统级 UTF-8 设置

### 7.1 Windows 10 1903+ 的 Beta 功能

Windows 10 版本 1903（2019年5月更新）引入了系统级 UTF-8 支持：

#### 通过设置开启：

1. 打开 `设置` → `时间和语言` → `语言`
2. 点击 `管理语言设置`
3. `管理` 标签页 → `更改系统区域设置`
4. 勾选 `Beta版：使用 Unicode UTF-8 提供全球语言支持`

#### 通过注册表开启：

```powershell
# 以管理员身份运行
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\Nls\CodePage" `
    -Name "UTF8" `
    -Value 1 `
    -PropertyType DWord `
    -Force
```

### 7.2 优点与风险

| 优点 | 风险 |
|------|------|
| 所有程序默认 UTF-8 | 旧版程序可能异常 |
| 无需逐个工具配置 | 部分遗留软件不兼容 |
| 与 Linux 行为一致 | 可能影响某些系统工具 |

**建议**: 对于纯开发环境，可以开启；如果是主力机，建议谨慎。

---

## 八、其他 CLI 工具特殊处理

### 8.1 npm/pnpm 设置

```powershell
# npm 配置
npm config set charset utf-8

# package.json 中显式声明
{
  "scripts": {
    "start": "cross-env NODE_OPTIONS=--max-old-space-size=4096 node src/index.js"
  }
}
```

### 8.2 Git 编码配置

```powershell
# Git 配置
git config --global core.quotepath false
git config --global gui.encoding utf-8
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding utf-8
```

### 8.3 Docker 容器编码

```dockerfile
# Dockerfile
FROM node:20-alpine
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
```

```powershell
# docker-compose.yml
services:
  app:
    environment:
      - LANG=C.UTF-8
      - LC_ALL=C.UTF-8
```

### 8.4 WSL 编码设置

```bash
# ~/.bashrc 或 ~/.zshrc
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8
export LANGUAGE=zh_CN:zh:en_US:en
```

---

## 九、常见问题排查

### 9.1 问题排查表

| 问题 | 可能原因 | 解决方法 |
|------|---------|----------|
| 配置后仍然乱码 | Profile 未正确加载 | 检查 `$PROFILE` 路径，确认文件内容 |
| Profile 未执行 | 执行策略限制 | 运行 `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| VS Code 中乱码 | 未选择 pwsh | Terminal → Select Default Profile → PowerShell |
| 某些命令乱码 | 该工具内部硬编码编码 | 使用 `chcp 65001` 临时切换 |
| Git 日志乱码 | Git 未配置 | 运行 `git config --global core.quotepath false` |
| 重启后配置丢失 | 修改了错误的 Profile | 确认修改的是 pwsh 的 Profile，不是 PS5.1 |

### 9.2 诊断命令

```powershell
# 一键诊断脚本
function Test-Encodings {
    Write-Host "=== PowerShell 编码诊断 ===" -ForegroundColor Cyan

    Write-Host "`n1. PowerShell 版本:" -ForegroundColor Yellow
    Write-Host "   Edition: $($PSVersionTable.PSEdition)"
    Write-Host "   Version: $($PSVersionTable.PSVersion)"

    Write-Host "`n2. 编码设置:" -ForegroundColor Yellow
    Write-Host "   OutputEncoding: $([Console]::OutputEncoding.EncodingName)"
    Write-Host "   CodePage: $([Console]::OutputEncoding.CodePage)"

    Write-Host "`n3. 环境变量:" -ForegroundColor Yellow
    Write-Host "   LANG: $env:LANG"
    Write-Host "   LC_ALL: $env:LC_ALL"

    Write-Host "`n4. Profile 路径:" -ForegroundColor Yellow
    Write-Host "   $PROFILE"
    Write-Host "   存在: $(Test-Path $PROFILE)"

    Write-Host "`n5. 测试输出:" -ForegroundColor Yellow
    Write-Host "   中文测试: 你好世界 ✓" -ForegroundColor Green
}

Test-Encodings
```

---

## 十、总结与最佳实践

### 10.1 核心结论

1. **问题本质**: Windows 终端默认编码（GBK）与现代 CLI 工具预期（UTF-8）不匹配
2. **唯一正解**: 使用 PowerShell 7 + 配置 UTF-8，让 Windows 行为对齐 Linux/macOS
3. **临时方案**: `chcp 65001` 仅适用于临时场景

### 10.2 最佳实践

| 场景 | 推荐方案 |
|------|---------|
| 日常开发 | 使用 pwsh，Profile 配置 UTF-8 |
| VS Code | 设置默认终端为 PowerShell |
| 新项目 | 默认 UTF-8，不考虑代码页兼容 |
| Legacy 项目 | 保持 GBK，使用 Git Bash 或 WSL |
| 跨平台脚本 | 明确声明 UTF-8，测试三平台 |

### 10.3 迁移建议

```powershell
# 从 cmd/PS5.1 迁移到 pwsh 的检查清单
☑ 安装 PowerShell 7
☑ 配置 Profile UTF-8 设置
☑ VS Code 设置默认终端
☑ Git 编码配置
☑ 测试常用 CLI 工具
☑ 更新团队文档
```

### 10.4 推荐阅读

- [PowerShell 7 官方文档](https://learn.microsoft.com/powershell/)
- [Unicode 与 UTF-8 详解](https://www.unicode.org/standard/WhatIsUnicode.html)
- [Windows Code Pages 参考](https://learn.microsoft.com/windows/win32/intl/code-page-identifiers)
- [Node.js 字符编码处理](https://nodejs.org/api/buffer.html)

---

## 结语

Windows 终端中文乱码是一个技术债务问题，根源在于 1980 年代的设计决策与当今互联网标准之间的冲突。通过升级到 PowerShell 7 并正确配置 UTF-8，我们可以让 Windows 开发环境跟上现代标准，享受与 Linux/macOS 用户一致的体验。

编码问题看似琐碎，但理解其背后的历史和技术原理，有助于我们更好地处理跨平台开发中的各种边缘情况。希望本文能帮助你彻底解决这个问题。

> 愿你的终端不再有乱码。🎉

---
