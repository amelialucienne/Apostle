global.window = {};
['data-books','data-bible','data-strong','parser'].forEach(f => require(__dirname + '/../scripts/'+f+'.js'));
const P = global.window.APOSTLE_PARSER;

const positifs = [
  ['1 Pierre 1 verset 5','1PE'], ['premier Pierre 1 verset 5','1PE'], ['un Pierre 1 verset 5','1PE'],
  ['1er Pierre 1 verset 5','1PE'], ['1 Corinthiens 13 verset 4','1CO'], ['premier Corinthien 13 verset 4','1CO'],
  ['un corinthien 13 verset 4','1CO'], ['2 Timothée 3 verset 16','2TI'], ['deuxième Timothée 3 verset 16','2TI'],
  ['deux Timothée 3 verset 16','2TI'], ['2e Timothée 3 verset 16','2TI'],
  ['Habacuc 1 verset 2','HAB'], ['abakouk 1 verset 2','HAB'], ['abacuc 1 verset 2','HAB'],
  ['Genèse 1 verset 1','GEN'], ['jeunesse 1 verset 1','GEN'], ['genaise 1 verset 1','GEN'],
  ['Ésaïe 53 verset 5','ISA'], ['isaie 53 verset 5','ISA'], ['ezaie 53 verset 5','ISA'],
  ['Néhémie 8 verset 10','NEH'], ['neemie 8 verset 10','NEH'],
  ['Sophonie 3 verset 17','ZEP'], ['sofonie 3 verset 17','ZEP'],
  ['Aggée 2 verset 9','HAG'], ['agee 2 verset 9','HAG'],
  ['Abdias 1 verset 15','OBA'], ['Philémon 1 verset 6','PHM'], ['filemon 1 verset 6','PHM'],
  ['Éphésiens 2 verset 8','EPH'], ['efeziens 2 verset 8','EPH'], ['ephesien 2 verset 8','EPH'],
  ['Ecclésiaste 3 verset 1','ECC'], ['ecclesiastes 3 verset 1','ECC'],
  ['Apocalypse 21 verset 4','REV'], ['apocalipse 21 verset 4','REV'],
  ['Matthieu 5 verset 3','MAT'], ['mathieu 5 verset 3','MAT'], ['matieu 5 verset 3','MAT'],
  ['Psaume 91 verset 1','PSA'], ['pseaume 91 verset 1','PSA'], ['saume 91 verset 1','PSA'],
  ['Colossiens 3 verset 2','COL'], ['colosiens 3 verset 2','COL'],
  ['1 Thessaloniciens 5 verset 16','1TH'], ['premier tessaloniciens 5 verset 16','1TH'],
  ['Jacques 1 verset 5','JAS'], ['Romains 8 verset 28','ROM'], ['Jean 3 verset 16','JHN'],
  ['Deutéronome 31 verset 6','DEU'], ['deuteronome 31 verset 6','DEU'],
  ['Cantique des cantiques 2 verset 1','SNG'], ['Lamentations 3 verset 23','LAM'],
  ['Ézéchiel 36 verset 26','EZK'], ['ezekiel 36 verset 26','EZK'],
  ['Zacharie 4 verset 6','ZEC'], ['Michée 6 verset 8','MIC'], ['michee 6 verset 8','MIC'],
  ['Osée 6 verset 3','HOS'], ['Joël 2 verset 28','JOL'], ['Amos 5 verset 24','AMO'],
  ['Nahum 1 verset 7','NAM'], ['Malachie 3 verset 10','MAL'], ['Tite 2 verset 11','TIT'],
  ['Hébreux 11 verset 1','HEB'], ['ebreux 11 verset 1','HEB'], ['Jude 1 verset 24','JUD'],
  ['Galates 5 verset 22','GAL'], ['Philippiens 4 verset 13','PHP'], ['filipiens 4 verset 13','PHP'],
  ['Proverbes 3 verset 5','PRO'], ['Esdras 7 verset 10','EZR'], ['Josué 1 verset 9','JOS'],
  ['Juges 6 verset 12','JDG'], ['Ruth 1 verset 16','RUT'], ['Exode 14 verset 14','EXO'],
  ['Lévitique 19 verset 18','LEV'], ['Nombres 6 verset 24','NUM'], ['Daniel 3 verset 17','DAN'],
  ['Jonas 2 verset 2','JON'], ['Esther 4 verset 14','EST'], ['Job 19 verset 25','JOB'],
  ['Marc 11 verset 24','MRK'], ['Luc 1 verset 37','LUK'], ['Actes 2 verset 38','ACT'],
  ['2 Corinthiens 5 verset 17','2CO'], ['1 Jean 4 verset 8','1JN'], ['premier Jean 4 verset 8','1JN'],
  ['3 Jean 1 verset 4','3JN'], ['1 Rois 19 verset 12','1KI'], ['2 Samuel 22 verset 2','2SA'],
  ['1 Chroniques 16 verset 11','1CH'], ['2 Chroniques 7 verset 14','2CH'],
  ['Jérémie 29 verset 11','JER'], ['jeremi 29 verset 11','JER']
];

const negatifs = [
  'le ciel est bleu aujourd hui', 'dans 3 ans nous verrons', 'il y a 10 ans',
  'Jean avait trois enfants', 'je reviens dans 2 minutes', 'nous sommes 5 personnes ici',
  'bonjour à tous et bienvenue', 'la paix soit avec vous', 'prions ensemble maintenant',
  'ouvrons nos coeurs', 'amen et amen', 'que Dieu vous bénisse tous',
  'dans 3 ans nous verrons', 'je reviens dans 2 minutes', 'pour 5 raisons',
  'mais 2 choses restent', 'comme 7 fois', 'alors 4 hommes sont venus',
  'le père et le fils', 'la grâce de Dieu', 'nous avons 12 personnes',
  'il est 10 heures', 'depuis 20 ans', 'environ 30 minutes', 'par 3 fois',
  'donc 6 jours', 'avec 8 enfants', 'sur 15 chaises', 'merci à tous',
  'nous sommes 5 personnes ici', 'comme 3 témoins', 'un homme de 40 ans',
  'il reste 2 choses', 'la fin du monde', 'pendant 7 semaines', 'à 8 heures du matin',
  'ce mot revient 9 fois', 'nous avons 4 groupes', 'au début des temps',
  'mes frères et mes soeurs', 'de tout mon coeur', 'depuis 6 mois',
  /* un nombre suivi d'une quantité n'est jamais un chapitre */
  'osez deux choses', 'juges trois fois', 'il faut oser 2 fois',
  /* un livre non reconnu ne doit pas glisser vers le passage affiché */
  'bla bla 1 verset 2', 'le pasteur a dit 3 chapitre 4', 'truc machin 5 verset 6'
];

/* ce que la reconnaissance écrit vraiment quand on dit « Osée » */
const osee = ['au zé 1 verset 2','o zé 1 verset 2','ozé 1 verset 2','oser 1 verset 2',
              'osez 1 verset 2','osée 1 verset 2','ozée 1 verset 2','o zée 1 verset 2'];

/* « verset 2 » après un passage affiché, et les liaisons qu'on prononce */
const contextuels = ['verset 2','versets 3 à 5','et verset 3','alors verset 4',
                     'ok on va au verset 5','chapitre 5','alors chapitre 6','puis chapitre 7'];

let ok=0, ko=[];
positifs.forEach(([t,attendu])=>{
  const r = P.analyser(t,{mode:'libre'});
  if(r.type==='passage' && r.livreId===attendu) ok++;
  else ko.push(t+'  → '+(r.type==='passage'? r.livreId+' au lieu de '+attendu : 'RIEN'));
});
console.log('POSITIFS : '+ok+' / '+positifs.length);
ko.forEach(x=>console.log('   échec : '+x));

let faux=[];
negatifs.forEach(t=>{
  const r = P.analyser(t,{mode:'libre'});
  if(r.type) faux.push(t+'  → '+(r.livre||r.type)+' '+(r.chapitre||''));
});
console.log('NÉGATIFS : '+(negatifs.length-faux.length)+' / '+negatifs.length+' correctement ignorés');
faux.forEach(x=>console.log('   faux positif : '+x));

let oseeOk=0, oseeKo=[];
osee.forEach(t=>{
  const r = P.analyser(t,{mode:'libre'});
  if(r.type==='passage' && r.livreId==='HOS') oseeOk++;
  else oseeKo.push(t+'  → '+(r.contextuel? 'glissement vers le passage affiché' : (r.livreId||'RIEN')));
});
console.log('OSÉE    : '+oseeOk+' / '+osee.length);
oseeKo.forEach(x=>console.log('   échec : '+x));

let ctxOk=0, ctxKo=[];
contextuels.forEach(t=>{
  const r = P.analyser(t,{mode:'libre'});
  if(r.type==='passage' && r.contextuel) ctxOk++;
  else ctxKo.push(t+'  → '+(r.type||'RIEN'));
});
console.log('SUITE   : '+ctxOk+' / '+contextuels.length);
ctxKo.forEach(x=>console.log('   échec : '+x));
