# setup.ps1 — Run this once from your project folder to fix all local issues
# Usage: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "Albert Jewish eReader — Local Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# ── 1. Fix package.json ───────────────────────────────────────────────────────
Write-Host "`n[1/4] Fixing package.json..." -ForegroundColor Yellow

$pkg = Get-Content package.json -Raw -Encoding UTF8
$pkg = $pkg -replace '"react": "18\.3\.2"',           '"react": "18.3.1"'
$pkg = $pkg -replace '"react-native": "0\.76\.9"',    '"react-native": "0.76.7"'
$pkg = $pkg -replace '\s+"@types/react-native":[^\n]+\n', ''
[System.IO.File]::WriteAllText("$PWD\package.json", $pkg, [System.Text.UTF8Encoding]::new($false))
Write-Host "  package.json fixed." -ForegroundColor Green

# ── 2. Fix Books.ts curly apostrophes ─────────────────────────────────────────
Write-Host "`n[2/4] Fixing Books.ts curly apostrophes..." -ForegroundColor Yellow

$books = [System.IO.File]::ReadAllText("$PWD\constants\Books.ts", [System.Text.Encoding]::UTF8)

# Replace the 7 broken description strings (curly right-single-quote U+2019 inside single-quoted JS strings)
# Strategy: change the outer quotes from '...' to "..." for each affected line
$books = $books -replace "'The foundational text of the Jewish people, paired with Rashi\u2019s([^']*)'",
                          '"The foundational text of the Jewish people, paired with Rashi''s$1"'
$books = $books -replace "'The definitive code of Jewish law \u2014 Orach Chaim, Yoreh De\u2019ah([^']*)'",
                          '"The definitive code of Jewish law — Orach Chaim, Yoreh De''ah$1"'
$books = $books -replace "'The Ramchal\u2019s masterwork([^']*)'",
                          '"The Ramchal''s masterwork$1"'
$books = $books -replace "'Rabbi Sacks\u2019s profound([^']*)'",
                          '"Rabbi Sacks''s profound$1"'
$books = $books -replace "'The Rav\u2019s iconic([^']*)'",
                          '"The Rav''s iconic$1"'
$books = $books -replace "'Elie Wiesel\u2019s devastating([^']*)'",
                          '"Elie Wiesel''s devastating$1"'
$books = $books -replace "'Maimonides\u2019 monumental([^']*)'",
                          '"Maimonides'' monumental$1"'

[System.IO.File]::WriteAllText("$PWD\constants\Books.ts", $books, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Books.ts fixed." -ForegroundColor Green

# ── 3. Install dependencies ───────────────────────────────────────────────────
Write-Host "`n[3/4] Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed. Try running it manually." -ForegroundColor Red
} else {
    Write-Host "  Dependencies installed." -ForegroundColor Green
}

# ── 4. Install web dependencies ───────────────────────────────────────────────
Write-Host "`n[4/4] Installing web dependencies (react-dom, react-native-web)..." -ForegroundColor Yellow
npm install react-dom@18.3.1 react-native-web --legacy-peer-deps
Write-Host "  Web dependencies installed." -ForegroundColor Green

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host "`nDone! Start the app with:" -ForegroundColor Cyan
Write-Host "  npx expo start --web" -ForegroundColor White
Write-Host "`nThen open: http://localhost:8081" -ForegroundColor White
Write-Host "Admin panel: http://localhost:8081/admin" -ForegroundColor White
