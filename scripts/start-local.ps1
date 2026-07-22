$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
if (-not $pnpmCommand) {
    $bundledNode = "C:\Users\João\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
    $bundledPnpm = "C:\Users\João\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd"
    if (-not (Test-Path -LiteralPath $bundledPnpm)) {
        throw "O gerenciador do programa não foi encontrado. Instale o Node.js e o pnpm para continuar."
    }
    $env:PATH = "$bundledNode;$env:PATH"
    $pnpm = $bundledPnpm
} else {
    $pnpm = $pnpmCommand.Source
}

$browserJob = Start-Job -ScriptBlock {
    Start-Sleep -Seconds 4
    Start-Process "http://localhost:3000"
}

try {
    Set-Location -LiteralPath $projectRoot
    Write-Host "Preparador EUDR iniciado em http://localhost:3000" -ForegroundColor Green
    Write-Host "Mantenha esta janela aberta enquanto estiver usando o programa."
    & $pnpm run dev
} finally {
    Remove-Job -Job $browserJob -Force -ErrorAction SilentlyContinue
}
