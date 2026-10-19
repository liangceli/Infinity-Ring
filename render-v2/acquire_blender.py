"""Download the official portable Blender archive after network approval."""
from pathlib import Path
import hashlib
import json
import shutil
import urllib.request
import zipfile

VERSION = '4.5.14'
FILENAME = f'blender-{VERSION}-windows-x64.zip'
BASE = 'https://download.blender.org/release/Blender4.5/'
ROOT = Path(__file__).resolve().parents[1] / '.tools' / 'blender'
TARGET = ROOT / f'blender-{VERSION}-windows-x64'

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent':'InfinityRing-AssetBuild/1.0'})
    return urllib.request.urlopen(request, timeout=60)

def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    if (TARGET / 'blender.exe').is_file() and (ROOT / 'verified-install.json').is_file():
        print(json.dumps({'status':'already_present','executable':str(TARGET/'blender.exe')}), flush=True)
        return
    if shutil.disk_usage(ROOT).free < 2_500_000_000:
        raise RuntimeError('At least 2.5 GB of free space is required for this portable runtime.')
    with fetch(BASE+f'blender-{VERSION}.sha256') as response:
        checksum_text=response.read(64_000).decode('utf-8')
    matching=[line.split()[0] for line in checksum_text.splitlines() if line.split() and line.split()[-1].lstrip('*')==FILENAME]
    if len(matching)!=1 or len(matching[0])!=64:
        raise RuntimeError('Official checksum manifest did not identify the requested Windows ZIP.')
    expected=matching[0].lower()
    archive=ROOT/FILENAME
    existing_ok=False
    if archive.is_file():
        with archive.open('rb') as handle:
            existing_ok=hashlib.file_digest(handle,'sha256').hexdigest()==expected
    print('Reusing verified archive' if existing_ok else 'Downloading official archive',flush=True)
    if not existing_ok:
        partial=ROOT/(FILENAME+'.partial')
        total=0;last_report=0;digest=hashlib.sha256()
        with fetch(BASE+FILENAME) as response,partial.open('wb') as output:
            while chunk:=response.read(1024*1024):
                total+=len(chunk)
                if total>650_000_000:
                    raise RuntimeError('Unexpected archive size; stopped before extracting.')
                digest.update(chunk);output.write(chunk)
                if total-last_report>=50_000_000:
                    print(f'Downloaded {total//1_000_000} MB',flush=True);last_report=total
        if digest.hexdigest()!=expected:
            raise RuntimeError('SHA-256 mismatch; archive will not be extracted.')
        partial.replace(archive)
    (ROOT / f'blender-{VERSION}.sha256').write_text(checksum_text, encoding='utf-8')
    with zipfile.ZipFile(archive) as bundle:
        if sum(x.file_size for x in bundle.infolist())>3_000_000_000:
            raise RuntimeError('Unexpected expanded archive size.')
        for member in bundle.infolist():
            resolved=(ROOT/member.filename).resolve()
            if not resolved.is_relative_to(TARGET.resolve()):
                raise RuntimeError('Archive member falls outside the expected version directory.')
        if bundle.testzip() is not None:
            raise RuntimeError('Archive CRC verification failed.')
        print('Extracting portable runtime',flush=True)
        bundle.extractall(ROOT)
    executable=TARGET/'blender.exe'
    if not executable.is_file():
        raise RuntimeError('Expected executable is absent after extraction.')
    info={'status':'downloaded_and_verified','version':VERSION,'source':BASE+FILENAME,'sha256':expected,'executable':str(executable)}
    (ROOT/'verified-install.json').write_text(json.dumps(info,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(info),flush=True)

if __name__=='__main__':
    main()
