Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Asus\.gemini\antigravity\brain\ba3a7a6d-3997-43a6-9931-939399b5daee\.user_uploaded\media_1790176158821.jpg"
if (-not (Test-Path $srcPath)) {
    $srcPath = "C:\Users\Asus\.gemini\antigravity\scratch\abhishek-credit-cards\assets\abhishek.jpg"
}

Write-Host "Source image: $srcPath"
$img = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Original dimensions: $($img.Width) x $($img.Height)"

# We want a high-resolution portrait crop focused on Abhishek's face & upper body
# Crop upper body/face region with high detail (e.g. 720 x 900 or 800 x 1000)
$cropX = [int]($img.Width * 0.15)
$cropY = [int]($img.Height * 0.05)
$cropWidth = [int]($img.Width * 0.70)
$cropHeight = [int]($img.Height * 0.70)

Write-Host "Cropping rect: X=$cropX Y=$cropY W=$cropWidth H=$cropHeight"

$targetW = 800
$targetH = 1000

$bmp = New-Object System.Drawing.Bitmap $targetW, $targetH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropWidth, $cropHeight
$destRect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH

$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Save with maximum quality (98%)
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]98)

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }

$destPath = "C:\Users\Asus\.gemini\antigravity\scratch\abhishek-credit-cards\assets\abhishek-face.jpg"
$bmp.Save($destPath, $jpegCodec, $encoderParams)

Write-Host "Saved high quality face crop to $destPath"

$g.Dispose()
$bmp.Dispose()
$img.Dispose()
