# Meshy'ye girdi olacak temiz referans: T-pozu 3B görüntüsünü FLUX Kontext ile konsept çizime çevirir.
#   node tools/meshy-referans.mjs <id...>       -> ai-kaynak/meshy/<id>-girdi.png
#   python3 tools/meshy-uret.py <id...>         -> ai-kaynak/meshy/<id>-ref.png   (REPLICATE_API_TOKEN, ~0,04 $)
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ai_uret as R
DIR = os.path.join(R.KOK, 'ai-kaynak', 'meshy')
ISTEM = ('Redesign this crude 3D game character as a polished, richly detailed stylized character concept for 3D modeling. Full body, straight front view, '
         'T-pose with both arms stretched out horizontally, legs slightly apart, feet flat, the whole figure including the hat and boots fully visible with margin. '
         'Plain flat light-gray background, even soft lighting, no cast shadow, no cape, no scenery, no text. '
         'Keep the same identity, costume type, main colors, headgear and weapon, but UPGRADE the quality: natural dark black-brown hair (no green tint), '
         'detailed face, realistic fabric folds, stitched seams, embroidered trims, individually visible armor plates, tooled leather straps and belts, worn boots, '
         'fur with visible tufts. Hand-painted stylized AAA game art look like Genshin Impact, crisp readable shapes, symmetrical, arms and legs clearly separated from the torso.')
for id in sys.argv[1:]:
    if not R.TOKEN: sys.exit('REPLICATE_API_TOKEN yok')
    url = R.yukle(os.path.join(DIR, f'{id}-girdi.png'))
    p = R.calistir('black-forest-labs/flux-kontext-pro', {'prompt': ISTEM, 'input_image': url, 'aspect_ratio': '1:1', 'output_format': 'png', 'seed': 5})
    out = p['output'] if isinstance(p['output'], str) else p['output'][0]
    R.indir(out, os.path.join(DIR, f'{id}-ref.png')); print('ref', id)
