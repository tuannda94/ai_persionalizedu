# -*- mode: python ; coding: utf-8 -*-
import os
from pathlib import Path

BASE_DIR = Path(SPECPATH).parent
MODEL_PACKAGES = BASE_DIR.parent.parent.parent / "storage" / "model-packages"

datas = []
if MODEL_PACKAGES.exists():
    for pkg_dir in MODEL_PACKAGES.glob("*_v1"):
        datas.append((str(pkg_dir), f"model-packages/{pkg_dir.name}"))

a = Analysis(
    ['app/main.py'],
    pathex=[str(BASE_DIR)],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'uvicorn', 'fastapi', 'chromadb', 'requests', 'sqlalchemy',
        'pydantic', 'pydantic_settings', 'python_dotenv'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='local-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
