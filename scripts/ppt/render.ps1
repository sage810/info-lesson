# 수업 PPT 점검 — PowerPoint 로 슬라이드를 PNG 로 내보내고, 글이 상자를 넘치는지 PowerPoint 가 잰 글 크기로 검사한다.
# npm run ppt -- <차시> --check 가 부른다. (이 파일은 UTF-8 BOM — Windows PowerShell 5.1 이 한글을 읽도록)
# 사용: powershell -NoProfile -ExecutionPolicy Bypass -File render.ps1 -Pptx <pptx> -OutDir <dir> [-TempFont <ttf>]
param([string]$Pptx, [string]$OutDir, [string]$TempFont = '')
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
New-Item -ItemType Directory -Force $OutDir | Out-Null

# 이 PC 에 없는 글꼴(Silkscreen)은 점검하는 동안만 불러온다(설치 아님 — 끝나면 내림)
Add-Type -Namespace W -Name F -MemberDefinition @'
[DllImport("gdi32.dll", CharSet=CharSet.Unicode)] public static extern int AddFontResourceW(string f);
[DllImport("gdi32.dll", CharSet=CharSet.Unicode)] public static extern bool RemoveFontResourceW(string f);
'@
if ($TempFont) { [void][W.F]::AddFontResourceW($TempFont) }

# 선생님이 PowerPoint 를 켜 두었으면 끄지 않는다(내가 연 파일만 닫는다)
$wasRunning = @(Get-Process POWERPNT -ErrorAction SilentlyContinue).Count -gt 0
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open($Pptx, -1, 0, 0)   # 읽기 전용, 창 없이
  $n = $pres.Slides.Count
  $issues = @()
  foreach ($i in 1..$n) {
    $sl = $pres.Slides.Item($i)
    $sl.Export((Join-Path $OutDir ('s{0:D2}.png' -f $i)), 'PNG', 1920, 1080)
    foreach ($sh in $sl.Shapes) {
      if ($sh.HasTable) {
        $bottom = ($sh.Top + $sh.Height) * 2
        if ($bottom -gt 980) { $issues += ('{0:D2} 넘침 [표] 아래 끝 {1:N0}px — 카드 아래(966px)를 지나요' -f $i, $bottom) }
        continue
      }
      if (-not $sh.HasTextFrame) { continue }
      if (-not $sh.TextFrame.HasText) { continue }
      $tr = $sh.TextFrame.TextRange
      $bh = $tr.BoundHeight; $bw = $tr.BoundWidth
      if (($bh -gt $sh.Height + 1.5) -or ($bw -gt $sh.Width + 1.5)) {
        $issues += ('{0:D2} 넘침 [{1}] 글 {2:N0}x{3:N0}px / 상자 {4:N0}x{5:N0}px' -f $i, $sh.Name, ($bw*2), ($bh*2), ($sh.Width*2), ($sh.Height*2))
      }
    }
  }
  $pres.Close()
  "PowerPoint 로 $n 장을 그렸어요"
  if ($issues.Count) { $issues } else { '넘침 없음' }
} finally {
  if (-not $wasRunning) { $app.Quit() }
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($app)
  [GC]::Collect(); [GC]::WaitForPendingFinalizers()
  if ($TempFont) { [void][W.F]::RemoveFontResourceW($TempFont) }
}
