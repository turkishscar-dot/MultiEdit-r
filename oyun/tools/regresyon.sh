#!/bin/sh
# Bütün testler: bot ile 7 bölüm (ölümsüz), 2 bölüm normal, Sonsuz Akın, düğümler, akışlar, ses, derleme.
cd "$(dirname "$0")/.."
ok=0; bad=0
run() { name="$1"; shift; out=$(timeout 900 "$@" 2>&1); if echo "$out" | grep -q '"errors":[1-9]\|hata: \[\|Error\|pageerror'; then bad=$((bad+1)); echo "HATA  $name"; echo "$out" | tail -5; else ok=$((ok+1)); echo "tamam $name $(echo "$out" | grep -o '"state":"[a-z]*"\|"dist":[0-9]*\|"medals":[0-9]*' | tr '\n' ' ')"; fi; }
for lv in 1 2 3 4 5 6 7; do run "bölüm $lv (ölümsüz)" node tools/test-bot.mjs --level $lv --seconds 900 --god; done
for lv in 1 2; do run "bölüm $lv (normal)" node tools/test-bot.mjs --level $lv --seconds 600; done
run "sonsuz akın" node tools/test-bot.mjs --endless --seconds 900 --god
for n in 1-0 2-1 5-1 g-kilpayi20 g-halka25; do run "düğüm $n" node tools/test-bot.mjs --node $n --seconds 300 --god; done
run "diyalog" node tools/dialog-test.mjs
run "ipuçları" node tools/tips-test.mjs
run "hayat suyu/çarşı/sonsuz" node tools/flow-test.mjs all
run "töre defteri" node tools/tore-test.mjs
run "yiğit/kademe/sefer" node tools/cards-test.mjs
run "ses" node tools/sound-test.mjs
run "olay sesleri" node tools/events-test.mjs
run "derleme" npx vite build
echo "SONUÇ: $ok tamam, $bad hatalı"
