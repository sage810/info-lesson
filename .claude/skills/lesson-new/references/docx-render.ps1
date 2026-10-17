# 양식(docx)을 Word(COM)로 열어 제목마다 쪽 번호를 찍고, 쪽마다 PNG 로 저장한다 — 양식을 고친 뒤 눈으로 확인할 때.
# 이 PC 에는 LibreOffice·pdftoppm 이 없어서 Word 의 쪽 그림(EMF)을 System.Drawing 으로 PNG 로 바꾼다. (가는 표 선이 몇 개 빠져 보일 수 있음 — 그림 변환 탓)
#   powershell -File .claude/skills/lesson-new/references/docx-render.ps1 -Docx "<절대 경로.docx>" -OutPrefix "<scratchpad>\page"
#   → pages=N · "p2  H1 ✍️ 여기부터 작성" 처럼 제목마다 쪽 번호 · <OutPrefix>-1.png, -2.png …
# 주의: 출력을 Select-Object -First 로 자르지 않는다(스크립트가 중간에 멈춰 숨은 Word 가 남음).
#       PowerShell 변수는 대소문자를 안 가린다($W 와 $w 는 같은 변수) — Word 개체는 $word 로만 쓴다.
#       선생님이 Word 를 쓰는 중이면 그 창은 건드리지 않는다(이 스크립트는 자기가 띄운 Word 만 닫음).
param([Parameter(Mandatory = $true)][string]$Docx, [Parameter(Mandatory = $true)][string]$OutPrefix)
Add-Type -AssemblyName System.Drawing
$word = New-Object -ComObject Word.Application
$word.Visible = $false
try {
  $doc = $word.Documents.Open($Docx, $false, $true)   # 변환 확인 안 함 · 읽기 전용
  $doc.ActiveWindow.View.Type = 3                     # 인쇄 모양
  "pages=" + $doc.ComputeStatistics(2)
  foreach ($para in $doc.Paragraphs) {
    if ($para.OutlineLevel -ne 10) { "p{0}  H{1} {2}" -f $para.Range.Information(3), $para.OutlineLevel, $para.Range.Text.Trim() }
  }
  $pane = $doc.ActiveWindow.Panes(1)
  for ($i = 1; $i -le $pane.Pages.Count; $i++) {
    $ms = New-Object System.IO.MemoryStream(, [byte[]]$pane.Pages.Item($i).EnhMetaFileBits)
    $mf = New-Object System.Drawing.Imaging.Metafile($ms)
    $pxW = 1000; $pxH = [int]($pxW * 297 / 210)        # A4 비율
    $bmp = New-Object System.Drawing.Bitmap($pxW, $pxH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::White)
    $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
    $g.DrawImage($mf, 0, 0, $pxW, $pxH)
    $bmp.Save("$OutPrefix-$i.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $mf.Dispose(); $ms.Dispose()
  }
  $doc.Close($false)
} finally {
  $word.Quit()
  [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
}
