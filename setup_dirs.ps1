$base = "C:\Users\black\Desktop\Open source fund"
$dirs = @(
  "backend",
  "frontend\src\components",
  "frontend\src\pages",
  "frontend\src\hooks",
  "frontend\src\utils",
  "frontend\public"
)
foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path "$base\$d" | Out-Null
}
Write-Output "All directories created."
