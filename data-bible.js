/* Apostle — catalogue des traductions.
   Le texte lui-même est chargé par bible-lsg.js et bible-kjv.js, générés
   par outils/construire-corpus.py depuis des sources du domaine public.
   Les traductions marquées « licence » ne sont pas fournies : elles
   demandent un accord avec leurs ayants droit. */

window.APOSTLE_BIBLE = window.APOSTLE_BIBLE || {};

window.APOSTLE_VERSIONS = [
  {id:"lsg", nom:"Louis Segond 1910",  langue:"fr", statut:"libre",
   mention:"Domaine public · Bible complète, 66 livres, 31 170 versets"},
  {id:"kjv", nom:"King James Version", langue:"en", statut:"libre",
   mention:"Domaine public · Bible complète, 66 livres, 31 100 versets"},
  {id:"s21", nom:"Segond 21",          langue:"fr", statut:"licence",
   mention:"Société Biblique de Genève · licence à négocier"},
  {id:"pdv", nom:"Parole de Vie",      langue:"fr", statut:"licence",
   mention:"Alliance biblique française · licence à négocier"},
  {id:"bds", nom:"Bible du Semeur",    langue:"fr", statut:"licence",
   mention:"Biblica · licence à négocier"},
  {id:"esv", nom:"English Standard Version", langue:"en", statut:"licence",
   mention:"Crossway · licence à négocier"}
];
