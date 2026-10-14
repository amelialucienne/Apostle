# Présentation d'Apostle

Tout ce qu'il faut pour montrer le projet et répondre aux questions.

## Avant de commencer, cinq minutes

1. Ouvrez l'application **dans un onglet Chrome**, depuis l'adresse GitHub Pages ou depuis le
   lanceur local. Jamais depuis un aperçu intégré dans une autre page, le micro y est refusé.
2. L'application s'ouvre directement sur le tableau de bord, il n'y a pas d'écran d'entrée à
   passer. Cliquez sur **« Tester le micro »**. Attendez les six secondes.
   S'il dit « Tout fonctionne », vous êtes prête.
3. Si le test échoue, suivez ce qu'il dit. En dernier recours, utilisez le bouton
   **« Démonstration guidée »** : il rejoue la même séquence sans micro, et il est annoncé comme
   une simulation. Votre présentation ne peut pas tomber à l'eau.
4. Fermez les autres onglets et applications qui utilisent le micro, Zoom et Teams en premier.
   Ils le gardent ouvert et empêchent la reconnaissance de le prendre.
5. Prévoyez une connexion internet. La reconnaissance du navigateur en a besoin.

## Le déroulé, six minutes

### 1. Le problème, trente secondes

Dans un culte, quand le prédicateur annonce un passage, quelqu'un en régie le cherche à la main
et l'envoie à l'écran. Huit à vingt secondes quand tout va bien. Du stress sur un bénévole, des
erreurs, et des prédicateurs qui finissent par renoncer à citer un passage pour ne pas casser le
rythme.

### 2. La démonstration, deux minutes

Ouvrez l'onglet Projection, activez le micro, et dites, en marquant une pause entre chaque :

| Dites | Montrez |
|---|---|
| « Jean 3 verset 16 » | le verset apparaît, sans rien avoir prononcé d'autre |
| « verset 17 » | le contexte est retenu, ni le livre ni le chapitre ne sont répétés |
| « Romains chapitre 8 versets 28 à 32 » | une plage, découpée en pages lisibles |
| « la version King James » | la traduction change, le passage reste |
| « Psaume 91 » | un chapitre entier |
| « le strong du mot servir » | cinq mots d'origine derrière un seul mot français, projetés |
| « le strong du mot manger » | deux mots d'origine, et les 667 versets où la racine apparaît |
| « le ciel est bleu aujourd'hui » | rien ne s'affiche, et c'est volontaire |

Cette dernière est la plus importante. Dites-la en expliquant pourquoi : le micro reste ouvert
pendant toute la prédication, et tout ce qui n'est pas une référence est ignoré en silence.

Finissez par le plein écran, touche `F`, et changez de thème. C'est ce que voit l'assemblée.

### 3. Ce qu'il y a derrière, deux minutes

Trois décisions à montrer, dans cet ordre.

**L'analyse n'utilise aucune intelligence artificielle générative.** Passer d'une phrase à une
référence est un problème d'analyse syntaxique. Une grammaire explicite est plus rapide,
gratuite, testable, et surtout déterministe. La même phrase donne toujours le même résultat, ce
qui est indispensable quand le résultat s'affiche devant trois cents personnes. L'IA sert à
transformer la voix en texte, et à rien d'autre.

**La Bible n'est pas dans une base de données.** 31 102 versets, 4,3 Mo, un contenu immuable et
identique pour toutes les églises. Le mettre en base ajouterait de la latence et une dépendance
réseau sur le geste central du produit. Il est compilé en fichiers statiques, chargé une fois,
et la lecture d'un verset devient un accès mémoire. L'application fonctionne hors ligne.

**L'affichage n'attend pas la fin de la transcription.** Dès que la phrase cesse de changer
pendant 280 millisecondes, ou dès que le détecteur local entend la fin de la parole, le passage
part. Deux à quatre secondes gagnées par commande.

### 4. Ce que vous savez du métier, une minute

Montrez que vous connaissez les vrais problèmes, pas seulement le code.

La qualité du signal compte plus que le modèle. Un micro d'ordinateur au fond d'une salle
réverbérante donne 80 % de reconnaissance, un départ auxiliaire de la table de mixage sur la
voie du prédicateur en donne 96. C'est l'écart entre un produit utilisable et un produit
abandonné.

Les traductions les plus demandées sont sous droits. Segond 21, Parole de Vie, Bible du Semeur
demandent chacune un accord avec leur ayant droit. Le produit est donc construit pour être
pleinement fonctionnel sur le domaine public seul, et pour brancher les autres quand les
licences existent.

Le micro ouvert pendant un culte est une question de conformité autant que de technique. La voix
est une donnée à caractère personnel. L'architecture cible garde la détection en local et ne
transmet que les commandes, environ deux minutes par culte au lieu de quatre-vingt-dix.

### 5. Les limites, trente secondes

Dites-les vous-même, avant qu'on vous les demande. C'est ce qui fait la différence entre une
démonstration et un travail d'ingénieur.

- C'est une maquette. Pas de comptes, pas de serveur, pas de base de données.
- La reconnaissance utilisée est celle du navigateur. Gratuite et pratique pour démontrer, mais
  elle transmet l'audio à Google et n'offre aucun engagement de service. Elle doit être
  remplacée en production.
- Le mode sans mot déclencheur oblige la transcription à tourner en continu. C'est plus fluide,
  mais toute la prédication transite par un tiers. La réponse prévue est la reconnaissance
  locale.
- Le lexique Strong couvre 112 entrées pour 125 mots français courants, pas les 14 000 du
  dictionnaire complet. Et le lien entre un mot français et un numéro Strong est une table
  établie à la main : les occurrences, elles, sont calculées sur le texte réellement embarqué.

## Les questions qu'on va vous poser

**Pourquoi pas une IA qui comprend la demande ?**
Parce qu'il faut du déterminisme. Un modèle de langage répond différemment à la même phrase,
ajoute de la latence, coûte à chaque appel, et peut inventer. Devant une assemblée, le texte
affiché doit venir d'une source vérifiable et le comportement doit être reproductible. La
grammaire fait le travail en trois millisecondes.

**Comment vous évitez les déclenchements involontaires ?**
Cinq règles. Un livre sans nombre n'affiche rien. Le nombre doit suivre le livre de près, donc
« Jean avait trois enfants » ne projette pas Jean 3. Un nombre suivi d'une quantité n'est pas un
chapitre, donc « osez deux choses » ne projette rien. Le chapitre demandé doit exister dans le
livre, ce qui écarte les confusions entre Jude et Juges. Et « verset 2 » n'est compris comme la
suite du passage affiché que si rien d'autre n'a été prononcé avant, pour qu'un nom de livre mal
reconnu ne fasse jamais glisser l'écran vers un autre texte. Un mode avec mot déclencheur est
disponible pour les contextes plus exigeants.

**Et si internet tombe pendant le culte ?**
La projection continue, les deux Bibles sont dans la page. La saisie au clavier fonctionne.
Seule la reconnaissance vocale s'arrête, avec un message explicite, et le micro reste ouvert.
Rien ne s'arrête d'un coup.

**Combien ça coûte à faire tourner ?**
Dans l'architecture cible, avec détection locale et transcription seulement sur les commandes,
de l'ordre du centime par culte. En mode écoute continue, autour de cinquante centimes.
L'hébergement est négligeable, le texte biblique est statique.

**Pourquoi Louis Segond et King James ?**
Parce qu'elles sont dans le domaine public et qu'aucune autorisation n'est nécessaire. C'est un
choix de conception : le produit doit être complet et utilisable sans dépendre d'une
négociation.

**Qu'est-ce que vous feriez ensuite ?**
Dans l'ordre : le détecteur de mot déclencheur en WebAssembly, pour que l'audio ne sorte du
poste que pendant les commandes. Un fournisseur de transcription professionnel hébergé dans
l'Union européenne. La seconde fenêtre de projection. Puis les comptes et les droits.

**Vous avez travaillé seule ?**
Oui, et le périmètre a été tenu volontairement serré autour d'un seul geste : dire une référence,
la voir apparaître. Tout ce qui s'en éloignait a été écarté.

## Si quelque chose casse pendant la démonstration

Gardez la main, ne vous excusez pas longuement, expliquez ce que vous voyez.

- **Le micro ne prend pas.** « Le navigateur protège le micro, je vous montre le diagnostic
  intégré. » Cliquez sur « Tester le micro », lisez le verdict à voix haute, puis passez à la
  démonstration guidée. Vous venez de montrer un produit qui sait expliquer sa propre panne, ce
  qui est un point en votre faveur.
- **Une référence ne sort pas.** Deux secours. La bande de propositions apparaît d'elle-même
  au-dessus de la barre avec les trois livres les plus proches, un clic suffit. Sinon tapez la
  référence dans la barre du bas, elle suit exactement le même analyseur, dites-le.
- **Montrez le journal d'écoute.** Sur l'accueil, il affiche mot pour mot ce que la
  reconnaissance a entendu et ce que l'analyseur en a fait. Un échec devient une démonstration
  de diagnostic plutôt qu'un blanc.
- **Rien ne répond.** Rechargez la page. Tout est local, le rechargement prend deux secondes.
