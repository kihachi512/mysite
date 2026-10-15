#!/usr/bin/env python3
"""
raw-front.pdf / raw-back.pdf（make-namecard.mjs の出力）から、羽車入稿用の print-*.pdf を作ります。

  python3 print/namecard/finish.py

やること
  1. Ghostscript で文字をアウトライン化（フォントを埋め込まず、すべて図形にする）
  2. マゼンタ（C0 M100 Y0 K0 相当）で描いた「白で刷る部分」を、
     羽車配布のカラーチップと同じ特色「デジタルホワイト」（代替色 C50 M100）に置き換える
  3. トンボと注記は K100 のまま
必要なもの: ghostscript, qpdf
"""
import re, subprocess, sys, pathlib

here = pathlib.Path(__file__).parent
out = here / 'out'

# 羽車のカラーチップと同じ名前（Shift-JIS のバイト列を PDF の名前として書く）
SPOT_NAME = b'/' + b''.join(b'#%02X' % c if c < 0x21 or c > 0x7e or c in b'#/()<>[]{}%' else bytes([c])
                           for c in 'デジタルホワイト'.encode('shift_jis'))
COLORSPACE = (b'/CSw [ /Separation ' + SPOT_NAME +
              b' /DeviceCMYK << /FunctionType 2 /Domain [ 0 1 ] /C0 [ 0 0 0 0 ] /C1 [ 0.5 1 0 0 ] /N 1 >> ]')

def run(*cmd):
    subprocess.run(cmd, check=True)

for side in ('front', 'back'):
    raw = out / f'raw-{side}.pdf'
    outlined = out / f'tmp-{side}-outlined.pdf'
    qdf = out / f'tmp-{side}.qdf'
    final = out / f'print-{side}.pdf'

    run('gs', '-q', '-o', str(outlined), '-sDEVICE=pdfwrite', '-dNoOutputFonts', '-dPDFSETTINGS=/prepress', str(raw))
    run('qpdf', '--qdf', '--object-streams=disable', str(outlined), str(qdf))

    data = qdf.read_bytes()
    n_fill = len(re.findall(rb'(?<![\d.])1 0 1 rg\b', data))
    n_stroke = len(re.findall(rb'(?<![\d.])1 0 1 RG\b', data))
    data = re.sub(rb'(?<![\d.])1 0 1 rg\b', b'/CSw cs 1 scn', data)
    data = re.sub(rb'(?<![\d.])1 0 1 RG\b', b'/CSw CS 1 SCN', data)

    # すべての /Resources に特色の定義を足す
    def add_cs(m):
        body = m.group(0)
        if b'/ColorSpace' in body:
            return re.sub(rb'/ColorSpace\s*<<', b'/ColorSpace << ' + COLORSPACE + b' ', body, count=1)
        return body.replace(b'/Resources <<', b'/Resources << /ColorSpace << ' + COLORSPACE + b' >>', 1)
    data, n_res = re.subn(rb'/Resources <<.*?>>\s*(?=/|>>)', add_cs, data, flags=re.S)

    qdf.write_bytes(data)
    with open(out / f'tmp-{side}-fixed.pdf', 'wb') as fh:
        subprocess.run(['fix-qdf', str(qdf)], check=True, stdout=fh)
    run('qpdf', str(out / f'tmp-{side}-fixed.pdf'), str(final))
    for t in out.glob(f'tmp-{side}*'):
        t.unlink()
    print(f'{final.name}: 文字をアウトライン化、特色に置き換え（塗り {n_fill} 箇所・線 {n_stroke} 箇所、リソース {n_res} 件）')
