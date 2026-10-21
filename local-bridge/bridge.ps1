# Modern Interior CRM - Native Windows PowerShell Folder Bridge
# Runs directly on Windows without requiring Node.js or any software installation!

$Port = 5001
$TargetBaseDir = "F:\1. MODERN INTERIOR\RUNNING FOLDER\MODERN-2024-25- RUNNING"

# If F: is not connected (e.g. testing), fallback to local Testing folder
$DriveMatch = [regex]::Match($TargetBaseDir, "^([a-zA-Z]:)")
$ActiveBaseDir = $TargetBaseDir
$TargetDrive = if ($DriveMatch.Success) { $DriveMatch.Groups[1].Value } else { "F:" }
$IsTargetDriveConnected = Test-Path ($TargetDrive + "\")

if (-not $IsTargetDriveConnected) {
    $FallbackDir = Join-Path $PSScriptRoot "..\Testing"
    if (-not (Test-Path $FallbackDir)) {
        New-Item -ItemType Directory -Path $FallbackDir -Force | Out-Null
    }
    $ActiveBaseDir = (Resolve-Path $FallbackDir).Path
    Write-Host "[NOTICE] Drive $TargetDrive not detected. Using fallback: $ActiveBaseDir" -ForegroundColor Yellow
} else {
    Write-Host "[OK] Target Drive $TargetDrive is connected!" -ForegroundColor Green
}

$Subfolders = @(
    "Drawings\AutoCad Drawings\Auto Cad File",
    "Drawings\AutoCad Drawings\PDF & JPG",
    "Drawings\Sketch up Drawings\PDF & JPG",
    "Drawings\Sketch up Drawings\Sketch Up File",
    "Estimate\PDF",
    "Materials Order and Bills",
    "Site Images & Videos\After Work",
    "Site Images & Videos\Before Work",
    "Site Images & Videos\Running work"
)

function Sanitize-Name([string]$val) {
    if (-not $val) { return "" }
    $clean = $val -replace '[\\/:*?"<>|]', '-'
    $clean = $clean -replace '\s+', ' '
    return $clean.Trim()
}

function Build-FolderName($siteRef, $customerName, $refName, $loc) {
    $cleanOrder = (Sanitize-Name $siteRef) -replace '^MI-\d{4}-\d{2}-', ''
    $cleanOrder = $cleanOrder.Trim()
    $cleanName = (Sanitize-Name $customerName).Trim()
    $cleanRef = (Sanitize-Name $(if ($refName) { $refName } else { $loc })).Trim()

    $parts = @()
    if ($cleanOrder) { $parts += $cleanOrder }
    if ($cleanName) { $parts += $cleanName }
    if ($cleanRef -and ($cleanRef.ToLower() -ne $cleanName.ToLower())) {
        $parts += $cleanRef
    }
    return ($parts -join " - ")
}

function Create-ProjectFolder($siteRef, $customerName, $refName, $loc) {
    $folderName = Build-FolderName $siteRef $customerName $refName $loc
    if (-not $folderName) {
        throw "Site reference or customer name is missing."
    }

    $customerPath = Join-Path $ActiveBaseDir $folderName
    if (-not (Test-Path $customerPath)) {
        New-Item -ItemType Directory -Path $customerPath -Force | Out-Null
    }

    foreach ($sub in $Subfolders) {
        $subPath = Join-Path $customerPath $sub
        if (-not (Test-Path $subPath)) {
            New-Item -ItemType Directory -Path $subPath -Force | Out-Null
        }
    }

    return @{
        success = $true
        folderName = $folderName
        folderPath = $customerPath
        baseDir = $ActiveBaseDir
        isTargetDriveConnected = $IsTargetDriveConnected
    }
}

# Start HttpListener
$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
    $Listener.Start()
} catch {
    Write-Host "[ERROR] Could not start HTTP listener on port $Port. It may already be in use." -ForegroundColor Red
    Write-Host $_.Exception.Message
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "🟢 Modern Interior Local Folder Bridge is RUNNING!" -ForegroundColor Green
Write-Host "📡 URL: http://127.0.0.1:$Port" -ForegroundColor White
Write-Host "📁 Target Folder: $TargetBaseDir" -ForegroundColor Yellow
Write-Host "💾 Active Folder: $ActiveBaseDir" -ForegroundColor White
Write-Host "💿 Target Drive Status: $(if ($IsTargetDriveConnected) { 'CONNECTED' } else { 'LOCAL FALLBACK' })" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "Keep this window open or run install-to-startup.bat to run in background." -ForegroundColor Gray
Write-Host ""

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        # Add CORS Headers
        $Response.AddHeader("Access-Control-Allow-Origin", "*")
        $Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $Response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

        if ($Request.HttpMethod -eq "OPTIONS") {
            $Response.StatusCode = 204
            $Response.Close()
            continue
        }

        $RawUrl = $Request.Url.AbsolutePath
        $Response.ContentType = "application/json"

        # 1. Health / Status
        if ($Request.HttpMethod -eq "GET" -and ($RawUrl -eq "/" -or $RawUrl -eq "/health" -or $RawUrl -eq "/api/status")) {
            $resObj = @{
                success = $true
                service = "Modern Interior Local Folder Bridge (PowerShell Native)"
                status = "online"
                port = $Port
                targetBaseDir = $TargetBaseDir
                activeBaseDir = $ActiveBaseDir
                isTargetDriveConnected = $IsTargetDriveConnected
                targetDrive = $TargetDrive
            }
            $json = $resObj | ConvertTo-Json
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $Response.OutputStream.Write($buffer, 0, $buffer.Length)
            $Response.Close()
            continue
        }

        # Read JSON Body for POST
        $bodyText = ""
        if ($Request.HasEntityBody) {
            $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
            $bodyText = $reader.ReadToEnd()
            $reader.Close()
        }
        $body = if ($bodyText) { $bodyText | ConvertFrom-Json } else { @{} }

        # 2. Create Project Folder
        if ($Request.HttpMethod -eq "POST" -and $RawUrl -eq "/api/create-folder") {
            $createRes = Create-ProjectFolder $body.siteRef $body.customerName $body.referenceName $body.location
            Write-Host "[CREATED] $($createRes.folderPath)" -ForegroundColor Green
            $json = $createRes | ConvertTo-Json
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $Response.OutputStream.Write($buffer, 0, $buffer.Length)
            $Response.Close()
            continue
        }

        # 3. Open Folder in Explorer
        if ($Request.HttpMethod -eq "POST" -and $RawUrl -eq "/api/open-folder") {
            $folderPath = $body.folderPath
            if (-not $folderPath -or $folderPath.StartsWith("/opt/render") -or -not (Test-Path $folderPath)) {
                $createRes = Create-ProjectFolder $body.siteRef $body.customerName $body.referenceName $body.location
                $folderPath = $createRes.folderPath
            }

            Start-Process "explorer.exe" -ArgumentList "`"$folderPath`""
            Write-Host "[OPENED IN EXPLORER] $folderPath" -ForegroundColor Cyan

            $resObj = @{
                success = $true
                message = "Folder opened in File Explorer"
                folderPath = $folderPath
            }
            $json = $resObj | ConvertTo-Json
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $Response.OutputStream.Write($buffer, 0, $buffer.Length)
            $Response.Close()
            continue
        }

        # 4. Sync All Sites
        if ($Request.HttpMethod -eq "POST" -and $RawUrl -eq "/api/sync-all-sites") {
            $synced = @()
            if ($body.sites) {
                foreach ($s in $body.sites) {
                    try {
                        $sRef = if ($s.siteRef) { $s.siteRef } else { $s.id }
                        $cRes = Create-ProjectFolder $sRef $s.customerName $s.refName $s.location
                        $synced += @{
                            siteRef = $sRef
                            customerName = $s.customerName
                            folderPath = $cRes.folderPath
                        }
                    } catch {
                        Write-Warning "Could not sync $($s.customerName): $_"
                    }
                }
            }
            $resObj = @{
                success = $true
                count = $synced.Count
                synced = $synced
            }
            $json = $resObj | ConvertTo-Json -Depth 3
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
            $Response.OutputStream.Write($buffer, 0, $buffer.Length)
            $Response.Close()
            continue
        }

        # 404
        $Response.StatusCode = 404
        $json = @{ success = $false; message = "Endpoint not found" } | ConvertTo-Json
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
        $Response.OutputStream.Write($buffer, 0, $buffer.Length)
        $Response.Close()

    } catch {
        Write-Error "Request handling error: $_"
    }
}
