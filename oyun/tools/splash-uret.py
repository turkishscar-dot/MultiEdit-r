# Yiğit kartları için çizgi roman (comic) tarzı splash art: 3B görüntüden FLUX Kontext ile.
# Anahtar dosyaya yazılmaz: REPLICATE_API_TOKEN ortam değişkeninden okunur.
#   node tools/splash-render.mjs [id...]            -> ai-kaynak/splash/<id>-girdi.png
#   python3 tools/splash-uret.py <id> [<id> ...]    -> ai-kaynak/splash/<id>-ai.png (yapay zekâ, ~0,04 $ / görsel)
#   python3 tools/splash-uret.py paket              -> src/assets/splash/<id>.jpg (640x360)
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ai_uret as R

DIR = os.path.join(R.KOK, 'ai-kaynak', 'splash'); CIK = os.path.join(R.KOK, 'src', 'assets', 'splash')
ISTEM = ('Redraw this 3D game character as a hand-drawn comic-book illustration, a champion splash art in the style of League of Legends '
         'skin art crossed with a Marvel comic cover: it must look like a real artist\'s drawing and painting, NOT a 3D render. '
         'Bold black ink linework, dynamic cel shading, halftone dots, rich saturated colors, dramatic rim light. '
         'Keep the character\'s exact costume, colors, headgear, weapon, beard and hair. Heroic dynamic action pose, character large and filling the frame, '
         'cinematic composition, epic painted comic background of a Central Asian steppe with dramatic sky, speed lines and energy swirls. '
         'No text, no letters, no logo, no watermark.')

PELERIN = (' The cape is drawn as a separate piece of cloth that flows and billows out behind the character, clearly behind the body and '
           'in front of the background, never merging into, blending with or passing through the body, arms or legs.')
KURK = (' The fur collar is a fluffy, soft natural fur mantle with tufts draped over the shoulders, NOT tubes, pipes, ropes or rings.')
OZEL = {'tonyukuk': ' His hair and beard are both pure white silver, long white beard and white hair, no black hair at all.'}
PELERINLI = ['oguz', 'mete', 'bumin', 'bilge', 'alperTunga', 'attila', 'dumrul', 'manas', 'ergenekon', 'hizir']
KURKLU = ['sogotoh', 'attila', 'ergenekon', 'fatih', 'ayisaman']


def istem(id):
    return ISTEM + (PELERIN if id in PELERINLI else '') + (KURK if id in KURKLU else '') + OZEL.get(id, '')


def uret(id):
    yol = os.path.join(DIR, f'{id}-girdi.png')
    url = R.yukle(yol)
    p = R.calistir('black-forest-labs/flux-kontext-pro', {'prompt': istem(id), 'input_image': url, 'aspect_ratio': 'match_input_image', 'output_format': 'png', 'seed': 7})
    out = p['output'] if isinstance(p['output'], str) else p['output'][0]
    R.indir(out, os.path.join(DIR, f'{id}-ai.png')); print('splash', id)


def paketle():
    from PIL import Image
    os.makedirs(CIK, exist_ok=True)
    for f in sorted(os.listdir(DIR)):
        if not f.endswith('-ai.png'): continue
        im = Image.open(os.path.join(DIR, f)).convert('RGB')
        w = 640; im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(os.path.join(CIK, f[:-7] + '.jpg'), quality=82, optimize=True)
    print('->', CIK, len(os.listdir(CIK)))


if __name__ == '__main__':
    a = sys.argv[1:]
    if a == ['paket']: paketle()
    else:
        if not R.TOKEN: sys.exit('REPLICATE_API_TOKEN yok')
        yeniden = '--yeniden' in a
        for id in [x for x in a if not x.startswith('--')]:
            if os.path.exists(os.path.join(DIR, f'{id}-ai.png')) and not yeniden: print('var', id); continue
            uret(id)
