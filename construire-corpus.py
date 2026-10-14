#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Apostle — construction du corpus biblique complet.

Entrées :
  - fichiers USFM de la Bible Louis Segond 1910, domaine public
    (dépôt BibleCorps/FRA-B-LSG1910-PD-UBS)
  - JSON de la King James Version, domaine public
    (dépôt thiagobodruk/bible)

Sortie :
  scripts/bible-lsg.js et scripts/bible-kjv.js
  window.APOSTLE_BIBLE.<version>[<LIVRE>] = [ [v1, v2, ...], ... ]
  Index de chapitre et de verset à partir de zéro.

Usage : python3 outils/construire-corpus.py <dossier_sfm> <kjv.json>
"""
import json, os, re, sys, glob, io

CANON = ["GEN","EXO","LEV","NUM","DEU","JOS","JDG","RUT","1SA","2SA","1KI","2KI",
         "1CH","2CH","EZR","NEH","EST","JOB","PSA","PRO","ECC","SNG","ISA","JER",
         "LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP",
         "HAG","ZEC","MAL","MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL",
         "EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE",
         "2PE","1JN","2JN","3JN","JUD","REV"]

PAIRES = ["x", "f", "fe", "qs", "rq"]
CARACTERES = ["wj","it","add","nd","bk","pn","qt","sig","tl","sc","em","bd","w","+"]

ECARTER = re.compile(
    r"^\\(id|ide|h|rem|sts|toc\d?|toca\d?|mt\d?|mte\d?|imt\d?|is\d?|ip\w*|iot|io\d?|"
    r"ior|iex|ie|imte\d?|s\d?|sr|r|rq|ms\d?|mr|d|sp|cl|cp|periph|"
    r"tr|tc\d?|th\d?|tcr\d?|thr\d?|qa|lit)\b")


def nettoyer(t):
    for m in PAIRES:
        t = re.sub(r"\\" + m + r"\s.*?\\" + m + r"\*", " ", t, flags=re.S)
    for m in CARACTERES:
        t = t.replace("\\" + m + "*", "").replace("\\" + m + " ", "")
    t = re.sub(r"\\[a-z0-9]+\*?", " ", t)
    t = t.replace("~", " ").replace("//", " ")
    return re.sub(r"\s+", " ", t).strip()


def lire_sfm(chemin):
    brut = io.open(chemin, encoding="utf-8-sig").read()
    brut = "\n".join(l for l in brut.split("\n") if not ECARTER.match(l.strip()))
    for m in PAIRES:
        brut = re.sub(r"\\" + m + r"\s.*?\\" + m + r"\*", " ", brut, flags=re.S)
    livre, chap = {}, None
    jetons = list(re.finditer(r"\\(c|v)\s+([0-9]+(?:[-\u2013][0-9]+)?)", brut))
    for i, j in enumerate(jetons):
        genre, valeur = j.group(1), j.group(2)
        fin = jetons[i + 1].start() if i + 1 < len(jetons) else len(brut)
        if genre == "c":
            chap = int(valeur); livre.setdefault(chap, {}); continue
        if chap is None: continue
        texte = nettoyer(brut[j.end():fin])
        if not texte: continue
        bornes = re.split(r"[-\u2013]", valeur)
        debut = int(bornes[0])
        livre[chap][debut] = texte
        for n in range(debut + 1, int(bornes[-1]) + 1):
            livre[chap][n] = ""
    return livre


def en_tableaux(livre):
    sortie = []
    for c in sorted(livre):
        versets = livre[c]
        if not versets: continue
        haut = max(versets)
        sortie.append([versets.get(v, "") for v in range(1, haut + 1)])
    return sortie


def ecrire(chemin, version, donnees):
    n_versets = sum(len(c) for b in donnees.values() for c in b)
    corps = json.dumps(donnees, ensure_ascii=False, separators=(",", ":"))
    with io.open(chemin, "w", encoding="utf-8") as f:
        f.write("/* Apostle — corpus %s, %d livres, %d versets.\n"
                "   Généré par outils/construire-corpus.py, ne pas modifier à la main. */\n"
                % (version, len(donnees), n_versets))
        f.write("window.APOSTLE_BIBLE = window.APOSTLE_BIBLE || {};\n")
        f.write("window.APOSTLE_BIBLE.%s = %s;\n" % (version, corps))
    print("%s : %d livres, %d versets" % (chemin, len(donnees), n_versets))


def main():
    dossier_sfm, chemin_kjv = sys.argv[1], sys.argv[2]
    ici = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sortie = os.path.join(ici, "scripts")

    lsg = {}
    for chemin in sorted(glob.glob(os.path.join(dossier_sfm, "*.sfm"))):
        code = re.search(r"-(\d+)-([A-Z0-9]{3})\.", os.path.basename(chemin))
        if not code or code.group(2) not in CANON: continue
        tab = en_tableaux(lire_sfm(chemin))
        if tab: lsg[code.group(2)] = tab
    manquants = [b for b in CANON if b not in lsg]
    if manquants: print("ATTENTION, livres absents :", manquants)
    ecrire(os.path.join(sortie, "bible-lsg.js"), "lsg", lsg)

    src = json.load(io.open(chemin_kjv, encoding="utf-8-sig"))
    if len(src) != 66: raise SystemExit("La source KJV ne contient pas 66 livres.")
    ecrire(os.path.join(sortie, "bible-kjv.js"), "kjv",
           {CANON[i]: src[i]["chapters"] for i in range(66)})


if __name__ == "__main__":
    main()
