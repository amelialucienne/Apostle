# Apostle

Projection biblique pilotée à la voix, pour les cultes.

Le prédicateur dit « Romains 2 verset 3 », le passage s'affiche sur l'écran de l'assemblée.
Pas de mot déclencheur, pas de clic, pas d'intermédiaire.

Louis Segond 1910 et King James Version sont embarquées en entier, 66 livres et plus de
31 000 versets chacune, et fonctionnent sans connexion.

## Démarrer en trente secondes

### En ligne, avec le micro qui fonctionne

L'application est publiée sur GitHub Pages. Ouvrez l'adresse du dépôt dans Chrome, Edge ou
Brave, cliquez sur le micro, autorisez l'accès, et dictez une référence.

### En local

| Système | Fichier à double-cliquer |
|---|---|
| Windows | `lancer-windows.bat` |
| macOS | `lancer-mac.command` |
| Linux | `lancer-linux.sh` |

Le lanceur démarre un petit serveur et ouvre `http://localhost:8000`. Laissez la fenêtre
ouverte pendant l'utilisation.

### Sans rien installer

Ouvrez `dist/apostle-standalone.html` par double-clic. Tout est dans ce seul fichier, les deux
Bibles comprises. Le micro ne fonctionnera pas dans ce mode, mais la barre de commande en bas
suit exactement le même chemin d'analyse que la voix.

## Pourquoi le micro refuse parfois de démarrer

Ce n'est presque jamais l'application. Les navigateurs appliquent trois règles strictes :

1. La page doit être servie en **https** ou depuis **localhost**. Un fichier ouvert directement
   depuis le disque, en `file://`, n'obtient jamais le micro.
2. Le site doit avoir l'**autorisation**. Chrome la demande une fois. Si elle a été refusée, il
   faut la rétablir par l'icône à gauche de la barre d'adresse, puis recharger.
3. Une page affichée **dans un cadre**, comme un aperçu intégré dans un autre site, se voit
   souvent refuser le micro.

L'application embarque un bouton **« Tester le micro »** sur l'écran d'accueil. Six secondes,
et il dit exactement où ça bloque : autorisation, niveau sonore capté, transcription reçue, et
quoi faire. C'est le premier réflexe en cas de problème.

Un bouton **« Démonstration guidée »** rejoue une suite de commandes sans micro. Il est annoncé
comme une simulation et sert à présenter le produit quand les conditions ne s'y prêtent pas.

## Comment on parle à Apostle

### La référence suffit

| Vous dites | Ce qui s'affiche |
|---|---|
| `Jean 3 verset 16` | Jean 3.16 |
| `verset 17` | Jean 3.17, le livre et le chapitre sont retenus |
| `chapitre 5` | Jean 5, le livre est retenu |
| `Romains chapitre 8 versets 28 à 32` | la plage, découpée en pages lisibles |
| `Psaume quatre-vingt-onze` | le chapitre entier |
| `la version King James` | change de traduction, le passage reste |
| `en anglais` | change de langue |
| `le strong du mot servir` | tous les mots d'origine derrière ce mot français, et les versets |
| `verset suivant` | page suivante |
| `écran noir` | coupe l'écran |

Les nombres dits en lettres sont convertis, composés compris : « vingt-huit »,
« quatre-vingt-onze », « soixante-dix ». Les ordinaux fonctionnent dans les deux langues :
« premier Corinthiens », « first Corinthians », « deuxième Timothée ».

### Ce qui ne déclenche rien

Un livre sans nombre n'affiche rien, et le nombre doit suivre le livre de près. « Jean avait
trois enfants » ne projette pas Jean 3. Tout ce qui n'est pas une référence est ignoré en
silence, ce qui permet de laisser le micro ouvert pendant toute la prédication.

Un second mode, dans les réglages, rétablit un mot déclencheur : « Apostle, donne-moi Romains 2
verset 3 ». Trois règles s'y cumulent, le déclencheur en tête de phrase, un verbe juste après,
et une référence valide. Il sert aux prédicateurs qui citent beaucoup de références sans vouloir
les projeter.

### Raccourcis clavier

`M` micro · `B` écran noir · `←` `→` pages · `Entrée` valider · `Échap` annuler · `F` plein écran

## Comment ça marche

### L'analyse des références

Aucun modèle de langage n'intervient. Passer d'une phrase transcrite à une référence structurée
est un problème d'analyse syntaxique, pas de génération. Une grammaire explicite est plus
rapide, gratuite, testable exhaustivement, et surtout déterministe : la même phrase donne
toujours le même résultat, ce qui est indispensable quand le résultat s'affiche devant trois
cents personnes.

La résolution du nom de livre se fait en quatre passes, la première qui aboutit gagne :

1. **exacte**, sur un lexique de 66 livres : noms français et anglais, abréviations, et
   322 variantes de prononciation. Ce dernier point est le plus utile en pratique. La
   reconnaissance n'écrit pas les noms bibliques, elle écrit ce qu'elle croit entendre :
   « Osée » devient « au zé », « oser », « o ze » ; « Habacuc » devient « habakuk » ou
   « a bas couque » ; « Juges » devient « juge » ou « jugé ». Chaque livre porte donc la
   liste de ce que la machine écrit réellement quand on prononce son nom
2. **ordinale**, qui accepte toutes les façons dont la voix écrit un numéro de livre :
   « 1 Pierre », « premier Pierre », « un Pierre », « 1er Pierre », « 2e Timothée »
3. **phonétique**, un encodage des sons du français qui compare ce qui s'entend plutôt que ce
   qui s'écrit. C'est lui qui rattrape « jeunesse » en Genèse, « abakouk » en Habacuc, « ezaie »
   en Ésaïe, « sofonie » en Sophonie
4. **distance d'édition** bornée, pour le reste
5. **validation canonique**, qui écarte un livre dont le chapitre demandé n'existe pas

À la voix, les abréviations de saisie comme « est » ou « ac » sont écartées : ce sont des mots
courants avant d'être des livres. Elles restent acceptées au clavier, où « jn 3.16 » fonctionne.

Deux garde-fous complètent ces passes, et ils comptent autant que la reconnaissance
elle-même. Un nombre suivi d'une quantité n'est jamais un chapitre, donc « osez deux choses »
ne projette rien. Et une suite comme « verset 2 » n'est comprise comme la suite du passage
affiché que si rien d'autre n'a été prononcé avant : « ozé 1 verset 2 » dont le livre n'aurait
pas été reconnu ne doit surtout pas glisser vers le verset 2 du passage précédent, ce qui
afficherait un autre texte que celui demandé sans que personne s'en aperçoive. Mieux vaut ne
rien afficher et proposer un rattrapage.

Le jeu de tests, `node outils/tester-livres.js`, couvre les 66 livres avec leurs déformations
les plus fréquentes, les phrases de prédication qui ne doivent rien déclencher, les huit façons
dont la voix écrit « Osée », et l'enchaînement « verset 2 » après un passage. Au dernier
passage : 95 références reconnues sur 95, 48 phrases sur 48 correctement ignorées, 8 sur 8 pour
Osée et 8 sur 8 pour les suites.

### Le lexique Strong

Le lexique embarque 112 entrées, grecques et hébraïques, pour 125 mots français courants
d'une prédication. Un mot français recouvre souvent plusieurs mots d'origine. « Servir » en est
l'exemple le plus parlant : trois verbes grecs et deux hébreux, qui ne disent pas la même
chose.

| Strong | Mot | Sens |
|---|---|---|
| G1398 | douleuō | servir comme esclave, appartenir à un maître |
| G3000 | latreuō | servir Dieu par un culte |
| G1247 | diakoneō | servir concrètement, assister |
| H5647 | abad | travailler, cultiver, servir |
| H8334 | sharath | servir comme officiant |

L'application les affiche tous, cliquables, et projette celui qu'on choisit sur l'écran de
l'assemblée. En dessous, les versets où la racine apparaît dans le texte embarqué, cliquables
eux aussi pour projeter directement le passage.

Une précision honnête : les occurrences sont calculées sur le texte réellement embarqué, mais le
lien entre un mot français et un numéro Strong est une table établie à la main. Un alignement
verset par verset demande un corpus balisé, le jeu STEPBible par exemple, publié sous licence
CC BY 4.0. C'est la suite logique du travail.

### Le journal d'écoute et le rattrapage

L'écran d'accueil affiche ce que la reconnaissance a entendu, mot pour mot, et ce que
l'analyseur en a fait. C'est là qu'on voit pourquoi une commande ne passe pas.

Quand un nombre a été entendu mais qu'aucun livre n'a été reconnu, une bande apparaît au-dessus
de la barre de commande avec les trois livres les plus proches. Un clic projette. Une erreur de
transcription se rattrape en une seconde au lieu de bloquer.

### L'écoute

Le micro s'ouvre une fois et reste ouvert. Un chien de garde vérifie toutes les trois secondes
que la reconnaissance tourne encore et la relance si Chrome l'a arrêtée, ce qu'il fait souvent
après un silence ou au bout d'une minute.

Un seul composant ouvre le micro, la reconnaissance. L'analyse du niveau sonore, qui en ouvrirait
un second, est désactivée par défaut : beaucoup de postes n'acceptent qu'un seul accès et c'est
alors la reconnaissance qui s'arrête. Elle reste activable dans les réglages.

L'affichage n'attend pas la fin de la transcription. Dès que la phrase cesse de changer pendant
280 millisecondes, ou dès que le détecteur local entend la fin de la parole, le passage part.

### Le texte biblique

Il n'est pas dans une base de données. Une traduction complète représente 31 102 versets,
environ 4,3 Mo, un contenu immuable et identique pour toutes les églises. Il est compilé en
fichiers statiques et chargé une fois, ce qui rend la lecture d'un verset instantanée et
disponible hors ligne.

### La projection

La taille de police se calcule à partir de la largeur réelle de l'écran et de la distance du
dernier rang, selon la règle audiovisuelle d'une hauteur de capitale d'au moins un cent
cinquantième de cette distance. Les longs passages sont découpés en pages dont la taille dépend
de la place réellement disponible.

## Organisation du dépôt

```
apostle/
  index.html                    l'application
  styles/app.css                feuille de style unique
  assets/logo.svg               logo : la Bible ouverte posée en V inversé, comme un toit,
                                et celui qui s'abrite dessous, assis
  scripts/
    data-books.js               les 66 livres, alias français et anglais, 322 variantes de
                                prononciation, nombres parlés
    data-bible.js               catalogue des traductions et de leurs droits
    bible-lsg.js                Louis Segond 1910 complète, 31 170 versets
    bible-kjv.js                King James Version complète, 31 100 versets
    data-strong.js              lexique Strong, 112 entrées pour 125 mots français
    ecoute.js                   écoute continue et détection d'activité vocale
    parser.js                   analyseur de commandes, grammaire déterministe
    app.js                      logique de l'application
  outils/construire-corpus.py   régénère les deux Bibles depuis leurs sources
  outils/tester-livres.js       jeu de tests de l'analyseur, 159 cas
  build.js                      construit la version autonome en un fichier
  dist/apostle-standalone.html  l'application entière dans un seul fichier
  lancer-windows.bat            lanceurs locaux, pour que le micro soit autorisé
  lancer-mac.command
  lancer-linux.sh
  PRESENTATION.md               déroulé de démonstration et réponses aux questions
  LICENCES.md                   sources des textes et statut des droits
```

Aucune dépendance. Pas de framework, pas de bibliothèque externe, pas de police téléchargée,
pas de service tiers. Du JavaScript standard, qui fonctionne hors ligne.

Pour reconstruire la version autonome après une modification : `node build.js`

## État du projet

C'est une maquette fonctionnelle, pas un produit en production. Ce qui marche réellement :
l'analyse des références, le corpus complet, la projection, l'écoute continue, la navigation
dans la Bible, les fiches Strong.

Ce qui n'existe pas encore : comptes et serveur, seconde fenêtre de projection indépendante
pilotée par `BroadcastChannel`, lexique Strong complet, traductions sous licence.

La reconnaissance vocale utilisée est celle du navigateur, `SpeechRecognition`. Elle est
gratuite et pratique pour démontrer, mais elle ne convient pas à la production : elle transmet
l'audio aux serveurs de Google sans contrat de sous-traitance exploitable et n'offre aucun
engagement de service. Le code isole l'accès au micro dans un seul module pour rendre ce
basculement simple.

## Les traductions

| Traduction | Statut | Source |
|---|---|---|
| Louis Segond 1910 | domaine public | fichiers USFM du dépôt BibleCorps |
| King James Version | domaine public | dépôt thiagobodruk/bible |

Segond 21, Parole de Vie, Bible du Semeur et ESV figurent au catalogue avec le statut « licence
requise ». Leur texte n'est pas fourni, et les demander déclenche un refus explicite, ce qui
reproduit le comportement attendu en production. Le détail est dans `LICENCES.md`.

## Suite

1. Détecteur de mot déclencheur en WebAssembly, pour que l'audio ne sorte du poste que pendant
   les commandes.
2. Fournisseur de transcription professionnel, hébergé dans l'Union européenne.
3. Seconde fenêtre de projection indépendante, envoyée sur le vidéoprojecteur.
4. Comptes, églises, rôles, droits sur les traductions.
5. Négociation des licences avec la Société Biblique de Genève, l'Alliance biblique française et
   Biblica.
