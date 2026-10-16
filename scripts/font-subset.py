# 공용 한글 글꼴 줄이기 — 활동지에 쓰는 글자만 남긴 woff2 (2026-10-16 audit)
#   python scripts/font-subset.py            → shared/fonts/*.woff2 를 줄인 것으로 바꿈(원본은 design/fonts/ 의 같은 이름 파일 — 늘 거기서 다시 만든다)
#   처음 한 번: python -m pip install --user fonttools brotli
# 남기는 글자: 한글 완성형 2,350자(KS X 1001) + 저장소의 모든 차시·데이터·스크립트에 실제로 나오는 글자 + 영문·숫자·문장부호·기호.
# 급식 메뉴·학생 이름에 2,350자 밖의 드문 글자가 오면 그 글자만 기본 글꼴로 보인다 — 새 차시·새 데이터를 넣은 뒤 다시 돌리면 된다.
import glob, os, shutil, sys
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'shared', 'fonts')
FULL = os.path.join(ROOT, 'design', 'fonts')   # 원본(줄이지 않은 것)
KOREAN = ['CookieRun-400.woff2', 'CookieRun-700.woff2', 'Maplestory-300.woff2', 'Maplestory-700.woff2', 'GangwonEdu-400.woff2']

chars = set()
for hi in range(0xB0, 0xC9):                     # KS X 1001 한글 2,350자
    for lo in range(0xA1, 0xFF):
        try: chars.add(bytes([hi, lo]).decode('euc-kr'))
        except UnicodeDecodeError: pass
for a, b in [(0x20, 0x7E), (0xA0, 0xFF), (0x2000, 0x206F), (0x2100, 0x21FF), (0x2460, 0x24FF), (0x2500, 0x27BF), (0x3000, 0x303F), (0x3131, 0x318E), (0xFF01, 0xFF5E)]:
    chars.update(chr(c) for c in range(a, b + 1))
for pat in ['lessons/**/*.html', 'lessons/**/*.json', 'data/*.json', 'materials/*.json', 'shared/**/*.js', 'site.config.json']:
    for f in glob.glob(os.path.join(ROOT, pat), recursive=True):
        try: chars.update(open(f, encoding='utf-8').read())
        except Exception: pass
chars = {c for c in chars if c.isprintable() or c == ' '}
text = ''.join(sorted(chars))
print('남기는 글자', len(text))

for name in KOREAN:
    src = os.path.join(FULL, name)
    if not os.path.exists(src): sys.exit(f'원본이 없어요: design/fonts/{name}')
    opts = subset.Options(); opts.flavor = 'woff2'; opts.layout_features = ['*']; opts.name_IDs = ['*']; opts.notdef_outline = True
    font = subset.load_font(src, opts)
    sub = subset.Subsetter(opts); sub.populate(text=text); sub.subset(font)
    out = os.path.join(FONTS, name); subset.save_font(font, out, opts)
    print(f'{name}: {os.path.getsize(src)//1024}KB → {os.path.getsize(out)//1024}KB')
