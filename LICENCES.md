# Licences et attributions

## Textes bibliques embarqués

| Traduction | Statut | Contenu | Source |
|---|---|---|---|
| Louis Segond 1910 | domaine public | 66 livres, 31 170 versets | fichiers USFM publiés par BibleCorps, dépôt `FRA-B-LSG1910-PD-UBS` |
| King James Version | domaine public | 66 livres, 31 100 versets | dépôt `thiagobodruk/bible` |

La King James demande une réserve : au Royaume-Uni elle relève d'un privilège perpétuel de la
Couronne et non simplement du domaine public. À vérifier avant une diffusion sur ce territoire.

Les deux corpus ont été convertis par `outils/construire-corpus.py`. La conversion écarte les
titres de section, les références parallèles et les notes de bas de page, qui n'appartiennent pas
au texte projeté. Une relecture par sondage reste recommandée avant un usage en culte.

## Traductions annoncées mais non fournies

Segond 21, Parole de Vie, Bible du Semeur et English Standard Version apparaissent dans le
catalogue avec le statut « licence requise ». **Aucun texte de ces traductions n'est inclus.**
Elles demandent une licence auprès de leurs ayants droit :

- Segond 21 et Nouvelle Édition de Genève : Société Biblique de Genève
- Parole de Vie, Bible en français courant, TOB : Alliance biblique française et Bibli'O
- Bible du Semeur, New International Version : Biblica
- English Standard Version : Crossway

La New International Version est explicitement exclue des dispositifs de licence express des
plateformes d'API bibliques. Une négociation directe est obligatoire.

## Lexique Strong

Le dictionnaire Strong de 1890 est dans le domaine public. Les entrées incluses en sont une
adaptation abrégée en français, limitée à une sélection de mots clés.

En production, les données morphologiques hébraïques et grecques et l'alignement des numéros
Strong proviennent du jeu STEPBible, publié sous licence CC BY 4.0, qui impose une attribution
visible dans l'application.

## Dépendances

Aucune. Ni bibliothèque externe, ni police téléchargée, ni service tiers. Tout le code a été
écrit pour ce projet, en JavaScript standard, et fonctionne hors ligne.

La reconnaissance vocale de la maquette repose sur l'API `SpeechRecognition` du navigateur. Dans
Chrome, cette API transmet l'audio aux serveurs de Google. Ce point doit être signalé à toute
personne qui teste l'application, et cette API ne doit pas être utilisée en production.

## Marque

Le nom « Apostle » n'a fait l'objet d'aucune recherche d'antériorité. Une recherche dans les
classes 9 et 42 est à mener avant tout investissement de communication.

## Avertissement

Ce document est une analyse de conception, pas un avis juridique. Une relecture par un juriste
spécialisé est nécessaire avant commercialisation.
