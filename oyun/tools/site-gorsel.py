# Tanıtım sitesi görselleri (splash art'larla aynı çizgi roman tarzı). REPLICATE_API_TOKEN ortam değişkeninden.
#   python3 tools/site-gorsel.py [ad...]   -> ai-kaynak/site/<ad>.png   (ana görsel ~0,04 $, bölge ~0,04 $)
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ai_uret as R

DIR = os.path.join(R.KOK, 'ai-kaynak', 'site')
STIL = ('hand-drawn comic-book illustration, like a League of Legends splash art crossed with a Marvel comic cover, bold black ink linework, '
        'halftone dot shading, dramatic rim light, rich saturated colors, cinematic wide composition, highly detailed. '
        'No text, no letters, no logo, no watermark, no modern objects.')
BOLGE = {
    'b1-otuken': 'Ancient Turkic fortress walls of Otuken at golden sunset, a wide stone road running along the top of the walls with red banners bearing a golden sun emblem and burning braziers, a huge one-eyed giant looming behind the far walls, dramatic clouds, mountains.',
    'b2-bataklik': 'A misty dark swamp at night, a long wooden boardwalk path with glowing paper lanterns, lily pads, eerie green moonlight, twisted trees, the ghostly silhouette of a long-haired female spirit in the fog far away.',
    'b3-altay': 'A snowy Altai mountain pass, a path through pine forest past small wooden log houses, falling snow, a giant seven-headed ogre standing on the ridge above, cold blue light.',
    'b4-gokyolu': 'A road through the sky high above the clouds at dawn, floating cloud islands, a white winged horse flying, a giant black eagle diving from the sky, golden light rays.',
    'b5-yeralti': 'The underworld: a black stone causeway over rivers of glowing lava, volcanic caverns, chains and iron cages, a red moon, a horned dark ruler on a distant throne of fire.',
    'b6-esir': 'An ancient Tang dynasty fortress gate with red pillars and curved roofs, cherry blossom trees, a stone bridge, imperial soldiers with shields guarding the gate, captive steppe warriors in chains, dramatic light.',
    'b7-karanlik': 'The Land of Darkness in the far north: an endless snowy tundra under an eternal night sky with green aurora, a frozen road, dog-headed warriors with spears appearing on the horizon, moonlight.',
}


def yaz(p, ad):
    out = p['output'] if isinstance(p['output'], str) else p['output'][0]
    R.indir(out, os.path.join(DIR, ad + '.png')); print('görsel', ad)


def ana():
    url = R.yukle(os.path.join(R.KOK, 'ai-kaynak', 'splash', 'oguz-ai.png'))
    ist = ('Turn this into a wide cinematic key art for a video game website. Keep the SAME hero with the exact same costume, colors, headgear, beard and sword. '
           'He runs heroically towards the viewer on an ancient stone road across the Central Asian steppe, a gray wolf with a blue mane runs beside him, '
           'a giant eagle soars in the sky, distant snowy mountains and a dramatic golden sunset. Keep the left third of the image as calmer sky for a title. ' + STIL)
    yaz(R.calistir('black-forest-labs/flux-kontext-pro', {'prompt': ist, 'input_image': url, 'aspect_ratio': '16:9', 'output_format': 'png', 'seed': 9}), 'ana')


if __name__ == '__main__':
    if not R.TOKEN: sys.exit('REPLICATE_API_TOKEN yok')
    os.makedirs(DIR, exist_ok=True)
    adlar = sys.argv[1:] or ['ana'] + list(BOLGE)
    for ad in adlar:
        if ad == 'ana': ana()
        else: yaz(R.calistir('black-forest-labs/flux-1.1-pro', {'prompt': BOLGE[ad] + ' ' + STIL, 'aspect_ratio': '16:9', 'output_format': 'png', 'safety_tolerance': 2}), ad)
