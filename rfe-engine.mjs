// Moteur commun au navigateur et au serveur. Référentiel vérifié le 20/10/2026.
export const VERSION = '2026-10-20';
export const SOURCES = [
 ['DGFiP — Loueurs en meublé (septembre 2026)', 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-loueurmeuble.pdf'],
 ['DGFiP — SCI (octobre 2026)', 'https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-sci.pdf'],
 ['DGFiP — La réforme', 'https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique'],
 ['BOFiP — Données de paiement', 'https://bofip.impots.gouv.fr/bofip/13901-PGP.html/identifiant=BOI-TVA-DECLA-20-30-60-20260930']
];
export const FIELDS = [
 {id:'structure',title:'Comment détenez-vous votre activité immobilière ?',help:'Répondez pour une seule personne ou structure. Une autre entité nécessite un diagnostic distinct.',options:[['lmnp','En nom propre · LMNP'],['lmp','En nom propre · LMP'],['sci_ir','SCI à l’impôt sur le revenu'],['sci_is','SCI à l’impôt sur les sociétés'],['indivision','En indivision'],['societe','Autre société'],['autre','Autre / je ne sais pas']]},
 {id:'activity',title:'Quelle activité souhaitez-vous analyser ?',help:'Pour plusieurs activités dans la même entité, choisissez « Plusieurs activités » : une revue sera nécessaire.',options:[['meublee','Location meublée d’habitation, sans services para-hôteliers'],['nue','Location nue d’habitation'],['pro_nu','Location de locaux professionnels nus'],['pro_equipe','Location de locaux professionnels équipés'],['para','Location avec services para-hôteliers'],['parking','Location de parking indépendante'],['gratuit','Mise à disposition exclusivement gratuite'],['mixte','Plusieurs activités / biens de nature différente'],['autre','Marchand de biens, agence ou autre activité immobilière']]},
 {id:'territory',title:'L’activité est-elle établie en France et le bien situé en France métropolitaine ?',help:'Les situations internationales, ultramarines ou avec un établissement étranger nécessitent une étude spécifique.',options:[['fr','Oui, les deux'],['autre','Non / situation internationale ou ultramarine'],['inconnu','Je ne sais pas']]},
 {id:'vat',title:'Quel régime de TVA s’applique à cette activité ?',help:'Ne pas facturer de TVA peut correspondre à une exonération, à la franchise en base ou à une absence d’assujettissement. Ce sont trois situations différentes.',options:[['taxable','TVA facturée, de plein droit ou sur option'],['franchise','Franchise en base de TVA (article 293 B)'],['exonere','Location exonérée de TVA (article 261 D)'],['non','Absence d’assujettissement confirmée pour cette entité'],['inconnu','Je ne sais pas']]},
 {id:'assujetti',title:'La qualité d’assujetti à la TVA est-elle reconnue pour cette entité ?',help:'L’IS, le statut LMNP/LMP ou un numéro SIREN ne suffisent pas, à eux seuls, à trancher cette question. Pensez aussi aux autres activités exercées dans la même entité.',options:[['oui','Oui, y compris au titre d’une autre activité'],['non','Non, gestion patrimoniale privée sans autre activité assujettie'],['inconnu','Je ne sais pas / à vérifier avec le cabinet']]},
 {id:'siren',title:'L’entité dispose-t-elle d’un numéro SIREN ?',help:'Le SIREN comporte 9 chiffres. Sa présence ne démontre pas à elle seule l’assujettissement à la TVA.',options:[['oui','Oui'],['non','Non'],['inconnu','Je ne sais pas']]},
 {id:'clients',title:'À qui facturez-vous cette activité ?',help:'Une entreprise peut être assujettie même lorsqu’elle ne facture pas de TVA. Pour un client public, un examen du circuit Chorus Pro est nécessaire.',options:[['b2b','Uniquement des entreprises assujetties établies en France'],['b2c','Uniquement des particuliers / clients non assujettis'],['etranger','Uniquement des clients établis à l’étranger'],['mixte','Plusieurs de ces catégories'],['public','Des organismes publics'],['inconnu','Je ne sais pas']]},
 {id:'size',title:'Quelle est la catégorie de votre entreprise ?',help:'La plupart des bailleurs individuels et petites SCI relèvent de la catégorie microentreprise / TPE / PME. Un groupe peut modifier l’analyse.',options:[['pme','Microentreprise, TPE ou PME'],['ge','ETI ou grande entreprise'],['inconnu','Je ne sais pas']]},
 {id:'debits',title:'Pour les loyers ou prestations taxables, comment la TVA est-elle exigible ?',help:'Cette information sert à déterminer la transmission des données de paiement. En cas de doute, ne supposez pas une option pour les débits.',options:[['encaissements','À l’encaissement'],['debits','Option pour la TVA sur les débits'],['sans','Pas de TVA facturée (franchise / exonération)'],['inconnu','Je ne sais pas']]}
];
export function validateAnswers(a){return FIELDS.every(f=>f.options.some(([v])=>v===a?.[f.id]));}
export function diagnose(a){
 if(!validateAnswers(a)) throw new Error('Questionnaire incomplet ou réponse invalide.');
 const checks=[]; let scoped=null;
 const taxable=['taxable','franchise'].includes(a.vat);
 const special=['mixte','autre'].includes(a.activity)||a.structure==='autre'||a.clients==='public';
 const presumedTaxable=['pro_equipe','para','parking'].includes(a.activity);
 const ordinaryExempt=['meublee','nue'].includes(a.activity);
 if(a.territory!=='fr') checks.push('Vérifier la territorialité et les établissements concernés.');
 if(special) checks.push('Effectuer une analyse par activité et par flux ; le circuit public est distinct.');
 if(taxable||a.assujetti==='oui') scoped=true;
 else if(a.vat==='non'&&a.assujetti==='non') scoped=false;
 else if(a.activity==='gratuit'&&a.assujetti==='non') scoped=false;
 if(a.vat==='inconnu') checks.push('Identifier le régime de TVA exact, notamment exonération et franchise en base.');
 if(a.vat==='non'&&a.assujetti==='oui') checks.push('Résoudre la contradiction entre absence d’assujettissement et assujettissement reconnu.');
 if(taxable&&a.assujetti==='non') checks.push('Résoudre la contradiction entre activité taxable ou en franchise et absence d’assujettissement.');
 if(presumedTaxable&&['exonere','non'].includes(a.vat)) checks.push('Vérifier la qualification de cette activité normalement taxable, les éventuelles exceptions et la franchise.');
 if(ordinaryExempt&&taxable) checks.push('Vérifier la TVA déclarée pour une location d’habitation normalement exonérée et ses éventuelles exceptions.');
 if(a.activity==='gratuit'&&taxable) checks.push('Vérifier la cohérence entre mise à disposition gratuite et régime de TVA.');
 if(a.activity==='para') checks.push('Confirmer les prestations réellement proposées et les conditions de qualification para-hôtelière.');
 if(a.activity==='pro_nu'&&a.vat==='taxable') checks.push('Vérifier l’option TVA des locaux et sa portée.');
 if(scoped===null) checks.push('Faire confirmer l’assujettissement : la seule perception de loyers, la forme juridique ou le régime fiscal ne permettent pas de conclure.');
 const uncertain=checks.length>0;
 const yes='Concerné'; const no='Non concerné pour ce flux'; const pending='À confirmer';
 let reception=scoped===false?no:scoped===true?yes:pending;
 if(scoped===true&&a.siren!=='oui'){reception=pending; checks.push('Vérifier la situation SIREN avant le raccordement à l’annuaire.');}
 let emission=no,transactions=no,payments=no;
 if(scoped!==false&&taxable){
  emission=['b2b','mixte'].includes(a.clients)?yes:['inconnu','public'].includes(a.clients)?pending:no;
  transactions=['b2c','etranger','mixte'].includes(a.clients)?yes:['inconnu','public'].includes(a.clients)?pending:no;
  payments=a.debits==='debits'?no:['encaissements','sans'].includes(a.debits)?yes:pending;
  if(a.vat==='taxable'&&a.debits==='sans'){payments=pending;checks.push('Préciser l’exigibilité de la TVA : de la TVA est déclarée comme facturée.');}
 }else if(a.vat!=='exonere'&&scoped!==false){emission=pending;transactions=pending;payments=pending;}
 // No definitive conclusion from contradictory or specialist inputs.
 if(uncertain){reception=pending;emission=pending;transactions=pending;payments=pending;}
 const date=a.size==='pme'?'1er septembre 2027':a.size==='ge'?'1er septembre 2026':'Échéance à confirmer selon la taille';
 const title=scoped===false&&!uncertain?'Hors champ, selon les informations déclarées':(checks.length||scoped===null)?'Votre situation nécessite une vérification':a.vat==='exonere'?'Réception des factures : vous êtes concerné':'Votre activité entre dans la réforme';
 return {version:VERSION,title,rows:[['Réception des factures fournisseurs',reception,'Depuis le 1er septembre 2026 si assujetti établi en France et identifié par un SIREN.'],['Émission de factures électroniques',emission,`${date} pour les opérations concernées entre assujettis établis en France.`],['E-reporting des transactions',transactions,`${date} pour les opérations concernées avec particuliers ou clients à l’étranger.`],['E-reporting des paiements',payments,`${date} pour les prestations concernées, selon l’exigibilité et les règles applicables.`]],checks:[...new Set(checks)],reason:a.vat==='exonere'?'Les locations exonérées au titre de l’article 261 D ne donnent pas lieu à émission électronique ni à e-reporting pour ces loyers. La réception dépend de la qualité d’assujetti de l’entité.':a.vat==='franchise'?'La franchise en base dispense de collecter la TVA, mais ne dispense pas, à elle seule, des obligations de la réforme.':'Le diagnostic distingue la situation de l’entité et les opérations qu’elle réalise.',next:scoped===false&&!checks.length?'Conserver les éléments justifiant votre situation et réexaminer le diagnostic si l’activité évolue.':'Confirmer la qualification TVA avec le cabinet puis, si vous êtes concerné, choisir une plateforme agréée et vérifier votre inscription à l’annuaire.',disclaimer:'Orientation automatisée établie sur vos seules déclarations, pour l’activité sélectionnée. Elle ne vaut pas validation de votre régime de TVA ni consultation personnalisée. Les autres activités et flux d’achat internationaux peuvent créer des obligations supplémentaires.'};
}
export function reportText(a,r){return `ALGEO IMMO — Votre diagnostic facturation électronique\nRéférentiel : ${VERSION}\n\n${r.title}\n\n${FIELDS.map(f=>`${f.title} ${f.options.find(([v])=>v===a[f.id])[1]}`).join('\n')}\n\n${r.reason}\n\n${r.rows.map(([label,status,detail])=>`${label} : ${status}\n${detail}`).join('\n\n')}\n\n${r.checks.length?'Points à vérifier :\n'+r.checks.map(s=>'• '+s).join('\n')+'\n\n':''}Prochaine étape : ${r.next}\n\n${r.disclaimer}\n\nSources :\n${SOURCES.map(([l,u])=>l+' : '+u).join('\n')}\n\nMaxime Carbou — ALGEO Partners\n18 boulevard de la Concorde, 13009 Marseille\ncontact@algeopartners.fr · 06 49 50 82 21\nhttps://algeopartners.fr/contact.html`}
