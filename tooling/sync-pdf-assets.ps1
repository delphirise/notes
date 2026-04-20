Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$PdfJsVersion = '3.11.174'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$VendorDir = Join-Path $RepoRoot 'app/vendor'
$CmapsDir = Join-Path $VendorDir 'cmaps'
$FontsDir = Join-Path $VendorDir 'standard_font_data'
$WasmFile = Join-Path $VendorDir 'pdf.wasm'

New-Item -ItemType Directory -Path $CmapsDir -Force | Out-Null
New-Item -ItemType Directory -Path $FontsDir -Force | Out-Null

function Get-UnpkgMeta {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    $metaUrl = "https://unpkg.com/pdfjs-dist@$PdfJsVersion/$Path/?meta"
    $response = Invoke-RestMethod -Uri $metaUrl -Method Get
    if (-not $response.files) {
        throw "No files returned for $Path from $metaUrl"
    }
    return $response.files
}

function Download-PdfJsAsset {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$RelativePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationPath
    )

    $baseUrls = @(
        "https://unpkg.com/pdfjs-dist@$PdfJsVersion",
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@$PdfJsVersion"
    )

    foreach ($baseUrl in $baseUrls) {
        $url = "$baseUrl/$RelativePath"
        try {
            Invoke-WebRequest -Uri $url -OutFile $DestinationPath
            return
        } catch {
            Write-Warning "Download failed from ${url}: $($_.Exception.Message)"
        }
    }

    throw "Unable to download $RelativePath from available CDNs"
}

function Sync-UnpkgFolder {
    Param(
        [Parameter(Mandatory = $true)]
        [string]$PackagePath,
        [Parameter(Mandatory = $true)]
        [string]$DestinationDir
    )

    $files = Get-UnpkgMeta -Path $PackagePath
    if (Test-Path $DestinationDir) {
        Get-ChildItem -Path $DestinationDir -Force | Remove-Item -Recurse -Force
    }

    $prefix = "/$PackagePath/"
    foreach ($file in $files) {
        if (-not $file.path -or $file.path.EndsWith('/')) {
            continue
        }

        if (-not $file.path.StartsWith($prefix)) {
            continue
        }

        $relativePath = $file.path.Substring($prefix.Length)
        $destinationPath = Join-Path $DestinationDir $relativePath
        $destinationFolder = Split-Path -Path $destinationPath -Parent
        New-Item -ItemType Directory -Path $destinationFolder -Force | Out-Null

        Download-PdfJsAsset -RelativePath $file.path.TrimStart('/') -DestinationPath $destinationPath
    }
}

Sync-UnpkgFolder -PackagePath 'cmaps' -DestinationDir $CmapsDir
Sync-UnpkgFolder -PackagePath 'standard_fonts' -DestinationDir $FontsDir

$buildMeta = Get-UnpkgMeta -Path 'build'
$wasmEntry = $buildMeta | Where-Object { $_.path -eq '/build/pdf.wasm' } | Select-Object -First 1
if ($wasmEntry) {
    Download-PdfJsAsset -RelativePath 'build/pdf.wasm' -DestinationPath $WasmFile
} elseif (Test-Path $WasmFile) {
    Remove-Item -Path $WasmFile -Force
}

Write-Host "Synced pdf.js assets from pdfjs-dist@$PdfJsVersion"