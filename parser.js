/* Apostle — analyseur de commandes vocales.
   Grammaire déterministe, aucun modèle génératif sur le chemin critique.
   Entrée : une transcription. Sortie : une intention structurée, ou rien. */

(function(){
  var BOOKS = window.APOSTLE_BOOKS;
  var NOM   = window.APOSTLE_NOMBRES;

  var DECLENCHEURS = ["apostle","apostel","apostele","apostelle","apostille","aposte","apotre","apostre","apostol"];
  var VERBES = ["donne moi","donne-moi","donnemoi","donne","montre moi","montre-moi","montre",
                "give me","giveme","show me","affiche","ouvre"];
  var REMPLISSAGE = ["chapitre","chapitres","verset","versets","vers","v","chapter","verse","verses",
                     "le","la","les","du","de","des","d","au","aux","et","s'il","te","plait","stp"];
  var SEPARATEURS = ["a","au","jusqu","jusqua","to","through","-"];

  function sansAccent(s){
    return s.normalize ? s.normalize("NFD").replace(/[\u0300-\u036f]/g,"") : s;
  }
  function normaliser(t){
    return sansAccent(String(t||"").toLowerCase())
      .replace(/[.,;:!?()"“”«»]/g," ")
      .replace(/(\d)\s*[-–—]\s*(\d)/g,"$1 a $2")
      .replace(/[-–—]/g," ")
      .replace(/'/g," ")
      .replace(/\s+/g," ").trim();
  }
  function distance(a,b){
    var m=a.length,n=b.length,i,j,prev,tmp,d=[];
    for(j=0;j<=n;j++) d[j]=j;
    for(i=1;i<=m;i++){
      prev=d[0]; d[0]=i;
      for(j=1;j<=n;j++){
        tmp=d[j];
        d[j]=Math.min(d[j]+1, d[j-1]+1, prev+(a[i-1]===b[j-1]?0:1));
        prev=tmp;
      }
    }
    return d[n];
  }

  /* ------------------------------------------------------------
     Encodage phonétique français.
     La reconnaissance vocale écrit ce qu'elle entend : « Genèse »
     devient « jeunesse », « Habacuc » devient « abakouk ». Comparer
     les sons plutôt que les lettres rattrape ces cas.
     ------------------------------------------------------------ */
  function phonetique(mot){
    var t = sansAccent(String(mot||"").toLowerCase()).replace(/[^a-z]/g,"");
    if(!t) return "";
    t = t.replace(/(.)\1+/g,"$1");                   /* lettres doublées */
    t = t.replace(/ph/g,"f");
    t = t.replace(/h/g,"");                          /* h muet */
    t = t.replace(/qu/g,"k").replace(/q/g,"k");
    t = t.replace(/eau|au/g,"o");
    t = t.replace(/ou/g,"u");
    t = t.replace(/oeu|eu/g,"e");
    t = t.replace(/ai|ei/g,"e");
    t = t.replace(/c([eiy])/g,"s$1").replace(/c/g,"k");
    t = t.replace(/g([eiy])/g,"j$1");
    t = t.replace(/([aeiou])s([aeiou])/g,"$1z$2");   /* s entre voyelles */
    t = t.replace(/x/g,"ks").replace(/y/g,"i");
    t = t.replace(/(.)\1+/g,"$1");
    if(t.length > 3) t = t.replace(/[edtsz]$/,"");   /* une seule finale muette */
    return t;
  }

  /* index des alias, du plus long au plus court */
  var INDEX=[];
  BOOKS.forEach(function(b){
    var complets = {};
    [b.fr, b.en].concat(b.voix || []).forEach(function(n){ complets[normaliser(n)] = 1; });
    var vus = {};
    [b.fr, b.en].concat(b.voix || []).concat(b.alias || []).forEach(function(n){
      var k = normaliser(n);
      if(!k || vus[k]) return;
      vus[k] = 1;
      INDEX.push({k:k, mots:k.split(" "), livre:b, complet: !!complets[k]});
    });
  });
  INDEX.sort(function(x,y){return y.mots.length-x.mots.length;});

  /* Index des sons, construit une fois.
     Uniquement sur les noms complets : les abréviations de saisie comme
     « dan » feraient entendre Daniel dans « dans trois ans ». */
  var SONS = [], sonsVus = {};
  BOOKS.forEach(function(b){
    [b.fr, b.en].concat(b.voix || []).forEach(function(n){
      var k = normaliser(n);
      if(!k || k.indexOf(" ") >= 0) return;
      var son = phonetique(k);
      if(son.length < 3) return;
      var cle = son + "|" + b.id;
      if(sonsVus[cle]) return;
      sonsVus[cle] = 1;
      SONS.push({son:son, livre:b});
    });
  });

  /* préfixes ordinaux tels que la reconnaissance vocale peut les écrire */
  var ORDINAUX = {
    "1":1,"1er":1,"1ere":1,"1re":1,"premier":1,"premiere":1,"un":1,"une":1,"first":1,
    "2":2,"2e":2,"2eme":2,"2nd":2,"2nde":2,"deuxieme":2,"second":2,"seconde":2,"deux":2,
    "3":3,"3e":3,"3eme":3,"troisieme":3,"trois":3,"third":3
  };

  function livreParId(id){
    for(var i=0;i<BOOKS.length;i++) if(BOOKS[i].id===id) return BOOKS[i];
    return null;
  }

  /* reconnaissance du livre en tête de la commande.
     strict = mode sans mot déclencheur : on refuse le rattrapage sur les
     noms courts, sinon « dans trois ans » deviendrait Daniel 3. */
  function trouverLivre(mots, strict){
    var i, cand, essai;

    /* passe 1 : correspondance exacte, la plus longue d'abord */
    for(i=0;i<INDEX.length;i++){
      cand=INDEX[i];
      if(cand.mots.length>mots.length) continue;
      /* à la voix, « est » ou « ac » sont des mots courants avant d'être
         des abréviations de livres : on ne garde que les noms complets */
      if(strict && !cand.complet && cand.k.length < 5) continue;
      essai=mots.slice(0,cand.mots.length).join(" ");
      if(essai===cand.k) return {livre:cand.livre, consomme:cand.mots.length, methode:"exacte", score:0.97};
    }

    /* passe 2 : préfixe ordinal puis nom de base, par les lettres ou par le son */
    var t0 = mots[0];
    var ord = (t0 !== undefined) ? ORDINAUX[t0] : undefined;
    if(ord !== undefined && mots.length > 1){
      var base = mots[1], baseSon = phonetique(base);
      for(i=0;i<BOOKS.length;i++){
        var b = BOOKS[i];
        if(b.ord !== ord || !b.base) continue;
        var formes = [normaliser(b.base)].concat((b.voix || []).map(normaliser));
        for(var f = 0; f < formes.length; f++){
          var ref = formes[f];
          if(!ref || ref.indexOf(" ") >= 0) continue;
          if(distance(base, ref) <= 2)
            return {livre:b, consomme:2, methode:"ordinal", score:0.92};
          if(baseSon.length >= 3 && distance(baseSon, phonetique(ref)) <= (baseSon.length >= 5 ? 1 : 0))
            return {livre:b, consomme:2, methode:"ordinal-son", score:0.88};
        }
      }
    }

    /* passe 3 : correspondance par le son, sur un seul mot */
    var son = phonetique(mots[0] || "");
    if(son.length >= 3){
      var tolerance = son.length >= 5 ? 1 : 0;
      var meilleurSon = null;
      for(i=0;i<SONS.length;i++){
        var d = distance(son, SONS[i].son);
        if(d <= tolerance && (!meilleurSon || d < meilleurSon.d)) meilleurSon = {d:d, livre:SONS[i].livre};
      }
      if(meilleurSon)
        return {livre:meilleurSon.livre, consomme:1, methode:"phonetique",
                score: meilleurSon.d === 0 ? 0.9 : 0.84};
    }

    /* passe 4 : distance d'édition, bornée selon la longueur du nom */
    var meilleur=null;
    for(i=0;i<INDEX.length;i++){
      cand=INDEX[i];
      if(cand.mots.length>mots.length) continue;
      essai=mots.slice(0,cand.mots.length).join(" ");
      if(essai.length<4) continue;
      if(strict && !cand.complet && cand.k.length < 5) continue;
      var n = cand.k.length;
      var seuil = strict ? (n<=5 ? 0 : (n<=9 ? 2 : 3))
                         : (n<=4 ? 1 : (n<=8 ? 2 : 3));
      if(seuil === 0) continue;
      var e = distance(essai, cand.k);
      if(e<=seuil && (!meilleur || e<meilleur.d))
        meilleur={d:e, livre:cand.livre, consomme:cand.mots.length};
    }
    if(meilleur) return {livre:meilleur.livre, consomme:meilleur.consomme, methode:"approchee",
                          score: meilleur.d===1 ? 0.82 : 0.76};
    return null;
  }

  /* conversion des nombres écrits en lettres.
     On n'agglomère deux mots que si le second prolonge réellement le premier,
     sinon « treize quatre » deviendrait dix-sept au lieu de deux nombres. */
  function valeurJeton(t){
    if(/^\d+$/.test(t)) return parseInt(t,10);
    var v = NOM[t];
    return v===undefined ? null : v;
  }
  function peutProlonger(prec, v){
    if(prec===null) return true;
    if((v===20 || v===100) && prec>=2 && prec<=9) return true;      /* quatre-vingt, deux cents */
    if(prec>=20 && prec<=90 && prec%10===0 && v>=1 && v<=19) return true; /* vingt-huit, soixante-dix */
    if(prec===10 && v>=7 && v<=9) return true;                      /* dix-sept */
    if(prec===100 && v<100) return true;                            /* cent cinquante */
    return false;
  }
  function lireNombre(mots, i){
    var total=0, prec=null, n=0;
    while(i+n < mots.length){
      var t = mots[i+n];
      if(t==="et" && n>0 && (i+n+1)<mots.length && valeurJeton(mots[i+n+1])!==null){ n++; continue; }
      var v = valeurJeton(t);
      if(v===null) break;
      if(!peutProlonger(prec, v)) break;
      if((v===20 || v===100) && prec!==null && prec>=2 && prec<=9) total = total - prec + prec*v;
      else total += v;
      prec = v; n++;
    }
    return n ? {valeur:total, consomme:n} : null;
  }

  /* transforme la suite de mots en une liste de nombres et de séparateurs */
  function extraireNombres(mots){
    var sortie=[], i=0;
    while(i<mots.length){
      var m=mots[i];
      if(SEPARATEURS.indexOf(m)>=0){ sortie.push({sep:true}); i++; continue; }
      if(REMPLISSAGE.indexOf(m)>=0){ i++; continue; }
      var lu = lireNombre(mots, i);
      if(lu){ sortie.push({n:lu.valeur}); i += lu.consomme; continue; }
      i++;
    }
    return sortie;
  }

  function retirerDeclencheur(txt, exiger){
    var t=txt, trouve=false, i;
    for(i=0;i<DECLENCHEURS.length;i++){
      var d=DECLENCHEURS[i];
      if(t.indexOf(d)===0){ t=t.slice(d.length).trim(); trouve=true; break; }
      var p=t.indexOf(d+" ");
      if(p>=0 && p<12){ t=t.slice(p+d.length).trim(); trouve=true; break; }
    }
    var verbe=false;
    for(i=0;i<VERBES.length;i++){
      var v=VERBES[i];
      if(t.indexOf(v)===0){ t=t.slice(v.length).trim(); verbe=true; break; }
    }
    if(exiger && !trouve) return null;
    return {reste:t, declencheur:trouve, verbe:verbe};
  }

  /* Le verbe doit suivre immédiatement le déclencheur : « Apostle, donne-moi… ».
     Sans cette règle, une phrase de prédication qui commence par « apôtre »
     et enchaîne sur une référence pourrait déclencher un affichage. */
  function verbeRequis(options){
    return options.exigerVerbe !== false;
  }

  /* ============================================================
     Mode « référence seule » : pas de mot déclencheur.
     On balaie la phrase et on retient la dernière référence complète.
     Un livre sans nombre ne déclenche rien, et le nombre doit suivre le
     livre de près, sinon « Jean avait trois enfants » afficherait Jean 3.
     ============================================================ */

  var MOTS_VERSET   = ["verset","versets","v","verse","verses"];
  var MOTS_CHAPITRE = ["chapitre","chapitres","chapter","chapters"];

  function lireNombresApres(mots, j){
    var res = [], sep = false, saut = 0;
    while(j < mots.length){
      var t = mots[j];
      var lu = lireNombre(mots, j);
      if(lu){ res.push(lu.valeur); j += lu.consomme; saut = 0; continue; }
      if(SEPARATEURS.indexOf(t) >= 0){ sep = true; j++; continue; }
      if(REMPLISSAGE.indexOf(t) >= 0){
        saut++;
        if(saut > 3) break;
        j++; continue;
      }
      break;
    }
    return {nombres:res, sep:sep, fin:j};
  }

  /* une référence complète qui commence au mot i : « romains deux verset trois » */
  /* Mots courants qui ne doivent jamais ouvrir une référence à la voix.
     « nous sommes cinq personnes » ne doit pas devenir Psaume 5. */
  var MOTS_INTERDITS = {
    "sommes":1,"somme":1,"comme":1,"homme":1,"hommes":1,"femme":1,"femmes":1,
    "dans":1,"donc":1,"alors":1,"ans":1,"an":1,"annee":1,"annees":1,"mois":1,
    "jour":1,"jours":1,"heure":1,"heures":1,"minute":1,"minutes":1,"seconde":1,"secondes":1,
    "semaine":1,"semaines":1,"fois":1,"personne":1,"personnes":1,"chose":1,"choses":1,
    "page":1,"pages":1,"point":1,"points":1,"euro":1,"euros":1,"degre":1,"degres":1,
    "enfant":1,"enfants":1,"frere":1,"freres":1,"soeur":1,"soeurs":1,"ame":1,"ames":1,
    "mot":1,"mots":1,"ligne":1,"lignes":1,"partie":1,"parties":1,"groupe":1,"groupes":1,
    "fin":1,"debut":1,"moment":1,"temps":1,"monde":1,"vie":1,"nom":1,"coeur":1
  };

  function lireReferenceIci(mots, i, strict){
    if(strict && MOTS_INTERDITS[mots[i]]) return null;
    var trouve = trouverLivre(mots.slice(i), strict);
    if(!trouve || trouve.score < 0.76) return null;
    var suite = lireNombresApres(mots, i + trouve.consomme);
    if(!suite.nombres.length) return null;            /* un livre seul n'affiche rien */
    /* à la voix, le nombre doit être un chapitre et pas une quantité :
       « osez deux choses » ou « juges trois fois » ne projettent rien */
    if(strict && MOTS_INTERDITS[mots[suite.fin]]) return null;
    var n = suite.nombres;
    var ref = {livre:trouve.livre, chapitre:n[0], de:null, a:null,
               methode:trouve.methode, score:trouve.score, fin:suite.fin};
    if(n.length === 2){ ref.de = n[1]; ref.a = n[1]; }
    else if(n.length >= 3){ ref.de = n[1]; ref.a = n[2]; }
    if(ref.chapitre > trouve.livre.ch) return null;   /* chapitre inexistant */
    return ref;
  }

  /* mots qu'on laisse passer avant « verset deux » : « et verset deux »,
     « alors verset deux », « ok on va au verset deux » */
  var LIAISONS = {
    "et":1,"puis":1,"alors":1,"donc":1,"ok":1,"okay":1,"maintenant":1,"ensuite":1,
    "au":1,"aux":1,"le":1,"la":1,"les":1,"du":1,"de":1,"a":1,"on":1,"va":1,"vas":1,
    "allons":1,"regardez":1,"lisons":1,"lisez":1,"voyons":1,"bien":1,"the":1,"to":1,"now":1
  };

  /* une référence qui s'appuie sur ce qui est déjà affiché : « verset quatre ».
     À la voix, on n'y recourt que si rien d'autre n'a été prononcé avant :
     « ozé 1 verset 2 » dont le livre n'a pas été reconnu ne doit surtout pas
     devenir « verset 2 » du passage affiché — ce serait afficher un autre texte
     que celui demandé, sans que personne s'en aperçoive. */
  function lireContextuelIci(mots, i, strict){
    var t = mots[i];
    var estV = MOTS_VERSET.indexOf(t) >= 0;
    var estC = MOTS_CHAPITRE.indexOf(t) >= 0;
    if(!estV && !estC) return null;
    if(strict){
      for(var k = 0; k < i; k++) if(!LIAISONS[mots[k]]) return null;
    }
    var suite = lireNombresApres(mots, i + 1);
    if(!suite.nombres.length) return null;
    var n = suite.nombres;
    if(estV) return {contextuel:"verset", de:n[0], a:(n.length > 1 ? n[1] : n[0]),
                     score:0.9, fin:suite.fin};
    return {contextuel:"chapitre", chapitre:n[0],
            de:(n.length > 1 ? n[1] : null), a:(n.length > 2 ? n[2] : (n.length > 1 ? n[1] : null)),
            score:0.9, fin:suite.fin};
  }

  function chercherReference(mots, strict){
    var dernier = null, i = 0;
    while(i < mots.length){
      var r = lireReferenceIci(mots, i, strict);
      if(!r) r = lireContextuelIci(mots, i, strict);
      if(r){ dernier = r; i = Math.max(i + 1, r.fin); continue; }
      i++;
    }
    return dernier;
  }

  function analyserLibre(brut, txt, strict){
    var mots = txt.split(" ").filter(Boolean);
    var court = mots.length <= 6;   /* les commandes de contrôle restent des phrases courtes */

    if(court){
      if(/^(efface|ecran noir|noir|masque|blank|clear)\b/.test(txt))
        return {type:"noir", brut:brut, normalise:txt, score:0.95};
      if(/(verset suivant|page suivante|suite|next)/.test(txt))
        return {type:"nav", direction:1, brut:brut, normalise:txt, score:0.9};
      if(/(verset precedent|page precedente|precedent|previous)/.test(txt))
        return {type:"nav", direction:-1, brut:brut, normalise:txt, score:0.9};
      var mL = txt.match(/en (francais|anglais|french|english)/);
      if(mL) return {type:"langue", brut:brut, normalise:txt, score:0.9,
                     langue:(mL[1]==="anglais"||mL[1]==="english") ? "en" : "fr"};
      var mV = txt.match(/version (.+)$/);
      if(mV){
        var cible = normaliser(mV[1]), choisie = null, best = 99;
        (window.APOSTLE_VERSIONS || []).forEach(function(v){
          var n = normaliser(v.nom);
          var d = (n.indexOf(cible) >= 0 || cible.indexOf(n) >= 0) ? 0 : distance(n, cible);
          if(d < best){ best = d; choisie = v; }
        });
        if(choisie && best <= 5)
          return {type:"version", version:choisie.id, nomVersion:choisie.nom,
                  statut:choisie.statut, brut:brut, normalise:txt, score:0.9};
      }
    }

    if(/\bstrong\b/.test(txt)){
      var apres = txt.replace(/.*\bstrong\b/, "").trim();
      var mC = apres.match(/\b([gh])\s?(\d{1,5})\b/);
      if(mC) return {type:"strong", code:mC[1].toUpperCase()+mC[2], brut:brut, normalise:txt, score:0.94};
      var mM = apres.match(/(?:du mot|of the word|mot|word)\s+(.+)$/);
      if(mM) return {type:"strong", mot:mM[1].trim(), brut:brut, normalise:txt, score:0.9};
      var reste2 = apres.replace(/^(le|la|du|de|des)\s+/, "").trim();
      if(reste2) return {type:"strong", mot:reste2, brut:brut, normalise:txt, score:0.78};
    }

    var r = chercherReference(mots, strict);
    if(!r) return {type:null, raison:"aucune_reference", brut:brut, normalise:txt, score:0.1};

    if(r.contextuel)
      return {type:"passage", contextuel:r.contextuel, chapitre:r.chapitre,
              de:r.de, a:r.a, score:r.score, brut:brut, normalise:txt};

    return {type:"passage", livreId:r.livre.id, livre:r.livre.fr, livreEn:r.livre.en,
            chapitre:r.chapitre, de:r.de, a:r.a,
            methode:r.methode, score:r.score, brut:brut, normalise:txt};
  }

  function analyser(brut, options){
    options = options || {};
    var exiger = options.exigerDeclencheur !== false;
    var versions = window.APOSTLE_VERSIONS || [];
    var txt = normaliser(brut);
    if(!txt) return {type:null, raison:"vide", brut:brut};

    if(options.mode === "libre") return analyserLibre(brut, txt, options.source !== "clavier");

    var tete = retirerDeclencheur(txt, exiger);
    if(!tete) return {type:null, raison:"pas_de_declencheur", brut:brut, normalise:txt};
    if(exiger && tete.declencheur && !tete.verbe && verbeRequis(options))
      return {type:null, raison:"verbe_manquant", brut:brut, normalise:txt};

    var reste = tete.reste;
    if(!reste) return {type:null, raison:"commande_vide", brut:brut, normalise:txt};

    /* commandes de contrôle */
    if(/^(efface|ecran noir|noir|masque|blank|clear)\b/.test(reste))
      return {type:"noir", brut:brut, normalise:txt, score:0.95};
    if(/(verset suivant|la suite|suivant|page suivante|next)/.test(reste))
      return {type:"nav", direction:1, brut:brut, normalise:txt, score:0.92};
    if(/(verset precedent|precedent|page precedente|retour|previous|back)/.test(reste))
      return {type:"nav", direction:-1, brut:brut, normalise:txt, score:0.92};

    /* changement de langue */
    var mLangue = reste.match(/(?:ce passage )?en (francais|anglais|french|english)/);
    if(mLangue){
      var lg = (mLangue[1]==="anglais"||mLangue[1]==="english") ? "en" : "fr";
      return {type:"langue", langue:lg, brut:brut, normalise:txt, score:0.93};
    }

    /* changement de version */
    var mVer = reste.match(/(?:la )?version (.+)$/);
    if(mVer){
      var cible = normaliser(mVer[1]), choisie=null, best=99;
      versions.forEach(function(v){
        var n=normaliser(v.nom);
        var d = n.indexOf(cible)>=0 || cible.indexOf(n)>=0 ? 0 : distance(n,cible);
        if(d<best){ best=d; choisie=v; }
      });
      if(choisie && best<=6)
        return {type:"version", version:choisie.id, nomVersion:choisie.nom,
                statut:choisie.statut, brut:brut, normalise:txt, score: best===0?0.95:0.8};
      return {type:null, raison:"version_inconnue", brut:brut, normalise:txt};
    }

    /* lexique Strong */
    if(/\bstrong\b/.test(reste)){
      var apres = reste.replace(/.*\bstrong\b/,"").trim();
      var mCode = apres.match(/\b([gh])\s?(\d{1,5})\b/);
      if(mCode) return {type:"strong", code:mCode[1].toUpperCase()+mCode[2], brut:brut, normalise:txt, score:0.94};
      var mMot = apres.match(/(?:du mot|of the word|mot|word)\s+(.+)$/);
      if(mMot) return {type:"strong", mot:mMot[1].trim(), brut:brut, normalise:txt, score:0.9};
      var nums = extraireNombres(apres.split(" "));
      if(nums.length && nums[0].n!==undefined)
        return {type:"strong", numero:nums[0].n, brut:brut, normalise:txt, score:0.82};
      var reste2 = apres.replace(/^(le|la|du|de|des)\s+/,"").trim();
      if(reste2) return {type:"strong", mot:reste2, brut:brut, normalise:txt, score:0.78};
      return {type:null, raison:"strong_incomplet", brut:brut, normalise:txt};
    }

    /* recherche par mot ou par thème */
    var mOcc = reste.match(/(?:toutes les occurrences|occurrences|toutes les references|references)\s+(?:du mot|concernant|sur|de|des)?\s*(.+)$/);
    if(mOcc) return {type:"recherche", terme:mOcc[1].trim(), brut:brut, normalise:txt, score:0.85};

    /* référence biblique */
    var mots = reste.split(" ").filter(Boolean);
    var trouve = trouverLivre(mots);
    if(!trouve) return {type:null, raison:"aucun_livre", brut:brut, normalise:txt, score:0.1};

    var suite = mots.slice(trouve.consomme);
    var jetons = extraireNombres(suite);
    var nombres = jetons.filter(function(j){return j.n!==undefined;}).map(function(j){return j.n;});
    var aSep = jetons.some(function(j){return j.sep;});

    var livre = trouve.livre, chapitre, de=null, a=null;
    if(nombres.length===0){ chapitre = 1; }
    else if(nombres.length===1){ chapitre = nombres[0]; }
    else if(nombres.length===2){ chapitre = nombres[0]; de = nombres[1]; a = aSep ? nombres[1] : nombres[1]; }
    else { chapitre = nombres[0]; de = nombres[1]; a = nombres[2]; }

    /* validation canonique : le chapitre demandé doit exister */
    var score = trouve.score;
    if(chapitre > livre.ch){
      var secours = null;
      INDEX.forEach(function(c){
        if(secours) return;
        if(c.livre.id!==livre.id && c.livre.ch>=chapitre && distance(c.k, normaliser(livre.fr))<=3) secours=c.livre;
      });
      if(secours){ livre=secours; score=Math.min(score,0.72); }
      else return {type:null, raison:"chapitre_inexistant", livre:livre.fr, chapitre:chapitre, brut:brut, normalise:txt};
    }

    return {
      type:"passage",
      livreId:livre.id, livre:livre.fr, livreEn:livre.en,
      chapitre:chapitre, de:de, a:a,
      methode:trouve.methode, score:score,
      brut:brut, normalise:txt
    };
  }

  /* ------------------------------------------------------------
     Propositions de rattrapage. Quand rien n'a été reconnu mais qu'un
     nombre a été entendu, on cherche les livres les plus proches de
     chaque mot, sans seuil, et on laisse l'opérateur choisir.
     ------------------------------------------------------------ */
  function suggestions(brut, limite){
    var txt = normaliser(brut);
    var mots = txt.split(" ").filter(Boolean);
    var vus = {}, out = [];

    for(var i = 0; i < mots.length; i++){
      var mot = mots[i];
      if(mot.length < 3 || valeurJeton(mot) !== null) continue;

      var suite = lireNombresApres(mots, i + 1);
      if(!suite.nombres.length) continue;

      var son = phonetique(mot);
      var candidats = [];
      BOOKS.forEach(function(b){
        var noms = [normaliser(b.fr), normaliser(b.en)];
        var meilleur = 99;
        noms.forEach(function(n){
          var premier = n.split(" ").pop();
          var d = Math.min(distance(mot, n), distance(mot, premier));
          var ds = son.length >= 3 ? distance(son, phonetique(premier)) : 99;
          meilleur = Math.min(meilleur, d, ds + 0.5);
        });
        if(meilleur <= 4) candidats.push({livre:b, d:meilleur});
      });
      candidats.sort(function(x, y){ return x.d - y.d; });

      candidats.slice(0, 3).forEach(function(c){
        var n = suite.nombres;
        var ch = n[0];
        if(ch > c.livre.ch) return;
        var ref = {livreId:c.livre.id, livre:c.livre.fr, chapitre:ch,
                   de:(n.length > 1 ? n[1] : null),
                   a:(n.length > 2 ? n[2] : (n.length > 1 ? n[1] : null)),
                   ecart:c.d};
        var cle = ref.livreId + "|" + ref.chapitre + "|" + ref.de + "|" + ref.a;
        if(vus[cle]) return;
        vus[cle] = 1;
        out.push(ref);
      });
    }
    out.sort(function(x, y){ return x.ecart - y.ecart; });
    return out.slice(0, limite || 3);
  }

  window.APOSTLE_PARSER = {
    suggestions:suggestions,
    phonetique:phonetique,
    analyser:analyser,
    chercherReference:chercherReference,
    normaliser:normaliser,
    livreParId:livreParId,
    trouverLivre:trouverLivre,
    distance:distance
  };
})();
