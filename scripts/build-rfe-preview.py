"""Build the self-contained review copy; does not enable email or publish the site."""
from pathlib import Path
import re,base64
root=Path(__file__).resolve().parents[1]
s=(root/'diagnostic-facturation-electronique.html').read_text()
s=re.sub(r'<link rel="stylesheet"[^>]*>', '',s)
s=re.sub(r'<script[^>]*src="[^"]*"[^>]*></script>', '',s)
css=(root/'styles.css').read_text()+'\n'+(root/'rfe.css').read_text()
s=s.replace('</head>','<style>'+css+'</style></head>')
s=s.replace('href="'+ 'diagnostic-facturation-electronique.html'+'"','href="https://algeopartners.fr/diagnostic-facturation-electronique.html"')
s=re.sub(r'href="(?!https?:|#|mailto:|tel:)([^"\s]+\.html[^"\s]*)"',lambda m:'href="https://algeopartners.fr/'+m[1]+'"',s)
for name in ['algeo-logo.png','favicon.png']:
 data='data:image/png;base64,'+base64.b64encode((root/name).read_bytes()).decode()
 s=s.replace('src="'+name+'"','src="'+data+'"').replace('href="'+name+'"','href="'+data+'"')
js=re.sub(r'^export ', '',(root/'rfe-engine.mjs').read_text(),flags=re.M)
app=re.sub(r'^import .*?;\n','',(root/'rfe-app.mjs').read_text(),count=1)
s=s.replace('</body>','<script>window.ALGEO_RFE={endpoint:"",turnstileSiteKey:""};</script><script type="module">'+js+'\n'+app+'</script></body>')
(root/'previews/Diagnostic_ALGEO_Immo.html').write_text(s)
