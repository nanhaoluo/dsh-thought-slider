<#
.SYNOPSIS
  把 dsh-thought-slider 以「正常安装」方式装进 DSH profile（打包副本，非符号链接）。

.DESCRIPTION
  流程：
    1. 在项目里 npm pack 出 tarball（dist/）；
    2. 在 profile 目录里把 node_modules\dsh-thought-slider 替换为真实目录副本；
    3. 把 profile package.json 依赖声明指向 file:<tarball>；
    4. 核对安装结果与文件一致性。

.PARAMETER Profile
  profile 名，默认取 $env:DSH_PROFILE，否则 desktop。

.PARAMETER Check
  只做检查，不执行写入。
#>
[CmdletBinding()]
param(
    [string]$Profile = ($env:DSH_PROFILE ?? "desktop"),
    [switch]$Check
)

$ErrorActionPreference = "Stop"
$projectDir = $PSScriptRoot
$dshHome = $env:DSH_HOME ?? (Join-Path $HOME ".dsh")
$profileDir = Join-Path $dshHome "profiles\$Profile"

if (-not (Test-Path $profileDir)) { throw "找不到 profile 目录：$profileDir" }

$distDir = Join-Path $projectDir "dist"
New-Item -ItemType Directory -Force -Path $distDir | Out-Null
$pkgJson = Get-Content (Join-Path $projectDir "package.json") -Raw | ConvertFrom-Json
$pkgName = $pkgJson.name
$tarball = Join-Path $distDir ("{0}-{1}.tgz" -f $pkgName, $pkgJson.version)

Write-Host "==> 打包/核对 $pkgName@$($pkgJson.version)" -ForegroundColor Cyan
if (-not (Test-Path $tarball)) {
    Push-Location $projectDir
    try {
        & npm pack --pack-destination $distDir --silent
    } finally {
        Pop-Location
    }
}
if (-not (Test-Path $tarball)) { throw "找不到 tarball：$tarball" }
$size = [Math]::Round((Get-Item $tarball).Length / 1KB, 1)
Write-Host "    产物：$tarball ($size KB)"

$spec = "file:" + ($tarball -replace "\\", "/")

if ($Check) {
    Write-Host "==> [Check 模式] 将写入依赖: `"$pkgName`": `"$spec`"" -ForegroundColor Yellow
    exit 0
}

# 释放副本到 profile 的 node_modules
$dest = Join-Path $profileDir "node_modules\$pkgName"
Write-Host "==> 释放独立副本到 $dest" -ForegroundColor Cyan

$tmp = Join-Path $env:TEMP ("dsh-install-" + [guid]::NewGuid().ToString("n"))
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
try {
    & tar --force-local -xzf $tarball -C $tmp
    $src = Join-Path $tmp "package"
    if (-not (Test-Path $src)) { throw "tarball 结构异常，缺少 package/ 目录" }

    if (Test-Path $dest) {
        $item = Get-Item $dest -Force
        if ($item.LinkType) {
            Write-Host "    移除旧符号链接: $($item.Target)" -ForegroundColor DarkGray
            $item.Delete()
        } else {
            Remove-Item $dest -Recurse -Force
        }
    }

    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item (Join-Path $src "*") $dest -Recurse -Force
    Write-Host "    已就位真实副本目录（非符号链接）" -ForegroundColor Green
} finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

# 更新 profile package.json 声明
$profilePkgPath = Join-Path $profileDir "package.json"
$pattern = "^(\s*`"" + [regex]::Escape($pkgName) + "`"\s*:\s*)`"[^`"]*`"(,?\s*)$"
$lines = Get-Content $profilePkgPath
$changed = $false
$out = foreach ($line in $lines) {
    if ($line -match $pattern) {
        $changed = $true
        ($line -replace $pattern, ("`$1`"" + $spec + "`"`$2"))
    } else {
        $line
    }
}
if ($changed) {
    Set-Content -Path $profilePkgPath -Value $out -Encoding UTF8
    Write-Host "    profile 依赖声明已更新：`"$pkgName`": `"$spec`"" -ForegroundColor Green
} else {
    Write-Warning "profile package.json 里未找到 $pkgName 声明"
}

# 校验
$installedItem = Get-Item $dest -Force
if ($installedItem.LinkType) {
    Write-Warning "警告：安装目标仍为符号链接！"
} else {
    Write-Host "==> 安装完成：已是独立真实目录副本" -ForegroundColor Green
}
