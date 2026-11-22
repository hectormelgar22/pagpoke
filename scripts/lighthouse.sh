#!/usr/bin/env bash
# Auditoría Lighthouse (móvil y escritorio) sobre la build servida en http://localhost:4322.
# Uso: npm run build && npx astro preview --port 4322 (en otra terminal) && bash scripts/lighthouse.sh
export CHROME_PATH="${CHROME_PATH:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
mkdir -p lighthouse
PAGINAS="/ /catalogo/ /catalogo/charizard-ex-151-199/ /torneos/ /torneos/copa-016/ /torneos/clasificacion/ /agenda/ /tienda/ /vende-tu-coleccion/ /contacto/"
for modo in movil escritorio; do
  extra=""
  [ "$modo" = "escritorio" ] && extra="--preset=desktop"
  for p in $PAGINAS; do
    n=$(echo "$p" | tr '/' '_')
    npx -y lighthouse@12 "http://localhost:4322$p" $extra --quiet --chrome-flags="--headless=new" --output=json \
      --output-path="lighthouse/$modo$n.json" --only-categories=performance,accessibility,best-practices,seo >/dev/null 2>&1
    node -e "const r=require('./lighthouse/$modo$n.json');const c=r.categories;console.log('$modo'.padEnd(11),'$p'.padEnd(34),Object.values(c).map(x=>Math.round(x.score*100)).join(' / '),' LCP',r.audits['largest-contentful-paint'].displayValue,' CLS',r.audits['cumulative-layout-shift'].displayValue,' TBT',r.audits['total-blocking-time'].displayValue)"
  done
done
