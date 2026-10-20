# Diagnostic facturation électronique — ALGEO Immo

## État de livraison

Le questionnaire, le moteur, l’affichage du résultat, l’export texte et l’impression PDF sont implémentés. Les liens depuis ALGEO Immo et Outils, la politique de confidentialité et le sitemap sont préparés. Le service d’envoi est implémenté mais **non raccordé** : aucune clé d’envoi n’est disponible et aucun email réel n’a été envoyé pour les tests. Les modifications sont proposées sur une branche séparée du site.

Ouvrir `previews/Diagnostic_ALGEO_Immo.html` dans un navigateur pour consulter la copie autonome, sans installation. L’envoi est désactivé dans cet aperçu.

## Choix métier

- Un questionnaire par personne / entité juridique ; les activités mixtes déclenchent une revue.
- Nom, prénom, email requis ; téléphone et structure facultatifs.
- 9 questions : structure, activité, territorialité, régime TVA, assujettissement, SIREN, clientèle, taille, exigibilité.
- Quatre résultats distincts : réception, émission, e-reporting transactions et paiements.
- La franchise en base n’est pas assimilée à une exonération de l’article 261 D.
- La forme SCI (IR ou IS), LMNP/LMP et le SIREN ne déterminent pas à eux seuls l’assujettissement. Les cas patrimoniaux sont conditionnels et les contradictions nécessitent vérification.
- Hors France métropolitaine, clientèle publique, para-hôtellerie, activités mixtes et autres métiers immobiliers : revue du cabinet, sans conclusion définitive.
- Les flux d’achats internationaux, autoliquidations et opérations immobilières complexes ne sont pas évalués : un diagnostic complémentaire peut être nécessaire.
- Le moteur est commun au navigateur et au serveur ; le serveur recalcule l’analyse.
- Réception : depuis septembre 2026 pour les entités dans le champ ; émission/e-reporting : septembre 2026 GE/ETI, septembre 2027 PME/micro.

Références vérifiées le 20 octobre 2026 : fiches DGFiP loueurs en meublé (septembre 2026), SCI (octobre 2026), portail de la réforme et BOFiP données de paiement. Les liens complets figurent dans `rfe-engine.mjs` et dans chaque diagnostic. Revoir ces références lors des évolutions réglementaires, notamment la recodification annoncée pour 2027.

## Activer l’envoi automatique

Le site GitHub Pages est statique. La clé d’envoi ne doit donc jamais figurer dans le HTML ou dans JavaScript public. Le dossier `rfe-api` contient un petit service Cloudflare Worker ; Resend envoie le diagnostic au prospect et une copie cachée à `contact@algeopartners.fr`.

1. Créer un compte Resend, ajouter et vérifier le domaine d’envoi (ou un sous-domaine dédié). Publier les entrées DNS qu’il fournit ; préserver les enregistrements de messagerie existants et ne pas créer plusieurs SPF concurrents. Valider l’adresse `diagnostic@algeopartners.fr`, ou adapter `FROM_EMAIL` au domaine vérifié.
2. Créer un compte Cloudflare Workers. Une migration DNS du site n’est pas nécessaire pour une adresse `workers.dev`.
3. Créer un widget Cloudflare Turnstile, autoriser `algeopartners.fr` et `www.algeopartners.fr`. Conserver la clé publique et le secret séparément.
4. Déployer `rfe-api/worker.mjs` avec `rfe-api/wrangler.toml`. Depuis la racine, avec Wrangler installé : `wrangler deploy --config rfe-api/wrangler.toml`.
5. Ajouter **côté Worker uniquement** les secrets `RESEND_API_KEY` et `TURNSTILE_SECRET_KEY`, via son tableau de bord ou `wrangler secret put NOM --config rfe-api/wrangler.toml`. Ne pas les committer, ni les transmettre dans une conversation.
6. Vérifier le binding de limite de débit `RFE_RATE_LIMITER` (5 requêtes par IP et minute), les domaines autorisés, l’adresse d’envoi et celle du cabinet. Le service refuse l’envoi si les secrets ou le binding sont absents.
7. Dans `rfe-config.js`, renseigner l’URL HTTPS du Worker et la clé **publique** Turnstile. Le bouton d’envoi apparaît seulement lorsque ces deux valeurs sont remplies.
8. Effectuer un vrai essai avec une adresse que vous contrôlez et vérifier l’arrivée du diagnostic ainsi que la copie au cabinet, y compris les spams. Tester un refus de protection anti-robot et un échec du service. Le succès signifie acceptation par le prestataire, pas garantie de remise en boîte de réception. Les erreurs de remise se suivent dans Resend.
9. Vérifier les contrats et garanties de traitement des deux prestataires, confirmer les durées de conservation retenues par le cabinet dans la politique de confidentialité, puis fusionner la proposition vers la branche publiée `Main-2`.

L’accès aux comptes Cloudflare/Resend et aux DNS est nécessaire pour ces étapes ; il n’était pas disponible lors de la création. Les tarifs et quotas dépendent des comptes choisis : les vérifier avant activation.

## Données et suivi prospect

Aucune base de données ni cookie n’est ajouté. Les coordonnées sont en mémoire pendant la visite. Avant la demande d’envoi, elles restent dans le navigateur. Au clic d’envoi, coordonnées, réponses et choix de rappel sont transmis au cabinet par email. Le rappel est facultatif et aucun consentement à une newsletter n’est déduit. Les données personnelles ne figurent ni dans l’URL ni dans les logs applicatifs.

La politique préparée prévoit 12 mois pour les demandes sans suite et au plus 3 ans depuis le dernier contact actif pour un suivi commercial demandé. Ces suppressions restent à appliquer dans les boîtes et les outils du cabinet, ainsi que dans les paramètres de conservation des prestataires : elles ne sont pas automatisées par cet outil.

Le rapport téléchargé contient les réponses et conclusions, sans imposer les coordonnées dans le nom du fichier. Les emails comprennent les coordonnées pour que le cabinet puisse traiter la demande. Aucun envoi réel n’est effectué par le développement ou les tests.

## Vérifications

`node --test tests/rfe.test.mjs` : 15 tests, dont profils métier, inconnues, contradictions, calendrier, validation serveur, refus d’origine, limite de débit, anti-robot, recalcul de l’analyse, copie cabinet et erreurs d’envoi. Les appels email et Turnstile sont simulés.

`node --check rfe-app.mjs` et `node --check rfe-api/worker.mjs` : syntaxe validée.

La vérification visuelle dans un navigateur et la remise réelle d’email restent à effectuer avant activation publique. Aucun navigateur de test n’était disponible dans cet environnement. La copie autonome se régénère avec `python3 scripts/build-rfe-preview.py`.
