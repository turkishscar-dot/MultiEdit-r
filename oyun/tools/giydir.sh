#!/bin/sh
# Meshy çıktısını oyun iskeletine giydirir: yalnız iskelet + gövde (GOVDE_TEK), 2048 doku.
# meshy_t.glb varsa (yazıdan üretilip tools/tpoz.py ile T-pozuna çevrilmiş, eklemleri oturtulmuş) o kullanılır ve yeniden ölçeklenmez.
cd /c/Users/kadir/Desktop/oguzkhan
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
for id in "$@"; do
  g=ai-kaynak/meshy/$id/meshy.glb; o=1
  [ -f ai-kaynak/meshy/$id/meshy_t.glb ] && { g=ai-kaynak/meshy/$id/meshy_t.glb; o=0; }
  [ -f "$g" ] || { echo "YOK $id"; continue; }
  OLCEK=$o GOVDE_TEK=1 DOKU=2048 "$B" -b --python tools/meshy_uydur.py -- "$g" "src/assets/yigit/$id.glb" 30000 2>&1 | grep -E "yazıldı|Error|Traceback" | head -3
done
