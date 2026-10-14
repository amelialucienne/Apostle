/* Apostle — logique de l'application. */

(function(){
  var P = window.APOSTLE_PARSER;
  var BIBLE = window.APOSTLE_BIBLE;
  var VERSIONS = window.APOSTLE_VERSIONS;
  var STRONG = window.APOSTLE_STRONG;

  var THEMES = [
    {id:"lumiere", nom:"Lumière",
     bg:"linear-gradient(160deg,#FFFFFF 0%,#EAF3FA 55%,#DBE9F5 100%)",
     fg:"#22384A", ref:"#6C8CA6",
     n1:"rgba(185,215,234,.65)", n2:"rgba(243,234,225,.85)", ray:"rgba(140,180,210,.45)",
     apercu:"linear-gradient(150deg,#FFFFFF,#DBE9F5)"},
    {id:"ciel", nom:"Ciel",
     bg:"linear-gradient(160deg,#E4F0F9 0%,#A9CDE6 55%,#7EAFD1 100%)",
     fg:"#12324A", ref:"#31607F",
     n1:"rgba(255,255,255,.7)", n2:"rgba(243,234,225,.5)", ray:"rgba(255,255,255,.65)",
     apercu:"linear-gradient(150deg,#E4F0F9,#7EAFD1)"},
    {id:"bois", nom:"Bois",
     bg:"linear-gradient(160deg,#2A1B10 0%,#5A3B23 55%,#33200F 100%)",
     fg:"#F7ECDE", ref:"#C7A98B",
     n1:"rgba(185,148,118,.4)", n2:"rgba(120,80,45,.5)", ray:"rgba(214,178,132,.35)",
     apercu:"linear-gradient(150deg,#5A3B23,#2A1B10)"},
    {id:"nuit", nom:"Nuit",
     bg:"linear-gradient(160deg,#0A1320 0%,#16293B 55%,#0C1926 100%)",
     fg:"#FFFFFF", ref:"#9EBBD2",
     n1:"rgba(92,147,184,.32)", n2:"rgba(185,148,118,.2)", ray:"rgba(140,185,220,.4)",
     apercu:"linear-gradient(150deg,#16293B,#0A1320)"}
  ];

  var EXEMPLES = [
    "Romains 2 verset 3",
    "Jean 3 verset 16",
    "verset 17",
    "Romains chapitre 8 versets 28 à 32",
    "Psaume 91",
    "chapitre 23",
    "Matthieu 5",
    "Ésaïe 53 versets 4 à 6",
    "Apocalypse 21",
    "écran noir",
    "la version King James",
    "le strong du mot grâce"
  ];


  var etat = {
    vue:"accueil",
    version:"lsg",
    theme:"nuit",
    taille:5.5,
    passage:null,      /* {livreId, chapitre, de, a} */
    pages:[],
    page:0,
    noir:false,
    ecoute:false,
    parole:false,
    veille:false,
    confirmation:false,
    mode:"libre",            /* "libre" = la référence seule suffit */
    niveauSonore:false,      /* second accès au micro, optionnel */
    strongProjete:null,
    exigerDeclencheur:false,
    exigerVerbe:true,
    anim:true,
    proposition:null,
    historique:[],
    stats:{cmd:12, abandons:3, latences:[0.52,0.61,0.55,0.63,0.58]}
  };

  var $ = function(id){ return document.getElementById(id); };

  /* ---------- corpus ---------- */
  function livre(id){ return P.livreParId(id); }

  function versetsDe(versionId, livreId, chap){
    var v = BIBLE[versionId];
    if(!v || !v[livreId]) return null;
    var c = v[livreId][chap - 1];
    return (c && c.length) ? c : null;
  }

  function nomLivre(b){
    return versionPar(etat.version).langue === "en" ? b.en : b.fr;
  }

  /* ---------- pagination ---------- */
  /* La règle de projection : la hauteur de texte vaut un pourcentage de la
     largeur de l'écran. On en déduit combien de caractères tiennent sur une page. */
  function dimensionsScene(){
    var sc = $("scene");
    var L = (sc && sc.clientWidth)  || 960;
    var H = (sc && sc.clientHeight) || Math.round(L * 9 / 16);
    var police = Math.max(13, L * etat.taille / 100);
    return {L:L, H:H, police:police};
  }

  function seuilCaracteres(){
    var d = dimensionsScene();
    var parLigne = Math.max(12, (d.L * 0.88) / (d.police * 0.50));
    var lignes   = Math.max(2,  (d.H * 0.64) / (d.police * 1.38));
    return Math.max(70, Math.floor(parLigne * lignes * 0.86));
  }

  function construirePages(){
    etat.pages = [];
    if(!etat.passage) return;
    var src = versetsDe(etat.version, etat.passage.livreId, etat.passage.chapitre);
    if(!src) return;
    var de = etat.passage.de || 1;
    var fin = etat.passage.a || (etat.passage.de ? etat.passage.de : src.length);
    if(de < 1) de = 1;
    if(fin > src.length) fin = src.length;
    if(fin < de) fin = de;

    var seuil = seuilCaracteres(), page = [], taille = 0;
    for(var n = de; n <= fin; n++){
      var t = src[n-1];
      if(!t) continue;
      if(page.length && taille + t.length > seuil){ etat.pages.push(page); page=[]; taille=0; }
      page.push({n:n, t:t});
      taille += t.length;
    }
    if(page.length) etat.pages.push(page);
    etat.page = 0;
  }

  /* ---------- rendu de la scène ---------- */
  function theme(){
    for(var i=0;i<THEMES.length;i++) if(THEMES[i].id===etat.theme) return THEMES[i];
    return THEMES[0];
  }

  function rendreScene(anime){
    var t = theme(), sc = $("scene");
    sc.style.background = t.bg;
    sc.style.color = t.fg;
    $("nuee1").style.cssText = "width:52%;height:70%;left:-10%;top:-22%;background:"+t.n1+(etat.anim?"":";animation:none");
    $("nuee2").style.cssText = "width:46%;height:62%;right:-8%;bottom:-24%;background:"+t.n2+(etat.anim?";animation-delay:-12s":";animation:none");
    $("rayon1").style.background = "linear-gradient(to bottom,transparent,"+t.ray+",transparent)";
    $("rayon2").style.background = "linear-gradient(to bottom,transparent,"+t.ray+",transparent)";
    if(!etat.anim){ $("rayon1").style.animation="none"; $("rayon2").style.animation="none"; }

    var vt = $("verset"), rf = $("reference");
    var dim = dimensionsScene();
    vt.style.fontSize = dim.police + "px";
    rf.style.fontSize = Math.max(9, dim.police * 0.42) + "px";
    rf.style.color = t.ref;
    sc.querySelector(".filigrane").style.color = t.fg;

    if(etat.strongProjete && STRONG[etat.strongProjete]){
      var e = STRONG[etat.strongProjete];
      vt.innerHTML =
        '<div class="s-orig" style="font-size:' + (dim.police * 1.5) + 'px">' + e.orig + '</div>' +
        '<div class="s-tr" style="font-size:' + (dim.police * 0.6) + 'px">' + e.tr + '</div>' +
        '<div class="s-sens" style="font-size:' + (dim.police * 0.52) + 'px">' + escapeHtml(e.sens) + '</div>';
      rf.textContent = (e.code + " · " + e.langue + " · " + (motStrong || e.mots[0])).toLowerCase();
      if(anime){ vt.classList.remove("apparait"); void vt.offsetWidth; vt.classList.add("apparait"); }
      $("pagination").textContent = "fiche lexicale";
      $("mention-droits").textContent = "Dictionnaire Strong 1890, domaine public";
      return;
    }

    if(!etat.passage || !etat.pages.length){
      vt.innerHTML = "";
      rf.textContent = "";
      return;
    }
    var page = etat.pages[etat.page] || [];
    var multi = page.length > 1;
    vt.innerHTML = page.map(function(v){
      return (multi ? '<span class="num">'+v.n+'</span>' : '') + escapeHtml(v.t);
    }).join(" ");
    var lv = livre(etat.passage.livreId);
    var ver = versionPar(etat.version);
    var ref = nomLivre(lv) + " " + etat.passage.chapitre;
    var premier = page[0].n, dernier = page[page.length-1].n;
    ref += "." + premier + (dernier!==premier ? "-"+dernier : "");
    rf.textContent = (ref + " · " + ver.nom).toLowerCase();

    if(anime){
      vt.classList.remove("apparait"); void vt.offsetWidth; vt.classList.add("apparait");
    }
    $("pagination").textContent = "page " + (etat.page+1) + " sur " + etat.pages.length;
    $("mention-droits").textContent = ver.nom + " · " + ver.mention;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]; });
  }
  function versionPar(id){
    for(var i=0;i<VERSIONS.length;i++) if(VERSIONS[i].id===id) return VERSIONS[i];
    return VERSIONS[0];
  }

  /* ---------- actions ---------- */
  function projeterStrong(code){
    if(!STRONG[code]) return;
    etat.strongProjete = code;
    etat.noir = false;
    $("scene").classList.remove("noire");
    rendreScene(true);
  }

  function projeter(ref, source){
    etat.strongProjete = null;
    etat.passage = {livreId:ref.livreId, chapitre:ref.chapitre, de:ref.de, a:ref.a};
    construirePages();
    if(!etat.pages.length){
      var lv = livre(ref.livreId), v = versionPar(etat.version);
      message("Ce passage n'existe pas dans " + v.nom + " (" + (lv ? lv.fr : ref.livreId) +
              " compte " + (lv ? lv.ch : "?") + " chapitres).", "err");
      etat.passage = null;
      return false;
    }
    etat.noir = false;
    $("scene").classList.remove("noire");
    rendreScene(true);
    ajouterHistorique();
    etat.stats.cmd++;
    etat.stats.latences.push(0.45 + Math.random()*0.35);
    majStats();
    if(source!=="historique") message("Projeté : " + texteReference(), "ok");
    return true;
  }

  function texteReference(){
    if(!etat.passage) return "";
    var lv = livre(etat.passage.livreId);
    var r = lv.fr + " " + etat.passage.chapitre;
    if(etat.passage.de) r += "." + etat.passage.de + (etat.passage.a && etat.passage.a!==etat.passage.de ? "-"+etat.passage.a : "");
    return r;
  }

  function ajouterHistorique(){
    var d = new Date();
    var h = ("0"+d.getHours()).slice(-2) + ":" + ("0"+d.getMinutes()).slice(-2);
    etat.historique.unshift({ref:texteReference(), heure:h, version:etat.version,
      p:{livreId:etat.passage.livreId, chapitre:etat.passage.chapitre, de:etat.passage.de, a:etat.passage.a}});
    etat.historique = etat.historique.slice(0,10);
    rendreHistorique();
  }

  function rendreHistorique(){
    var ul = $("historique");
    ul.innerHTML = "";
    if(!etat.historique.length){
      ul.innerHTML = '<li><span class="sous">aucun passage projeté pour l\'instant</span></li>';
      return;
    }
    etat.historique.forEach(function(h){
      var li = document.createElement("li");
      li.innerHTML = '<b>'+escapeHtml(h.ref)+'</b><span class="heure">'+h.heure+'</span>';
      var b = document.createElement("button");
      b.textContent = "rappeler";
      b.addEventListener("click", function(){ projeter(h.p, "historique"); allerVue("projection"); });
      li.insertBefore(b, li.lastChild);
      ul.appendChild(li);
    });
  }

  function majStats(){
    $("st-cmd").textContent = etat.stats.cmd;
    $("st-ab").textContent = etat.stats.abandons;
    var l = etat.stats.latences;
    var moy = l.reduce(function(a,b){return a+b;},0)/l.length;
    $("st-lat").textContent = moy.toFixed(2).replace(".",",") + " s";
  }

  function message(txt, classe){
    var r = $("retour");
    r.textContent = txt;
    r.className = "retour" + (classe ? " "+classe : "");
  }

  /* ---------- exécution d'une intention ---------- */
  function executer(intention){
    if(!intention || !intention.type){
      var raisons = {
        aucun_livre:"Aucune référence reconnue. Rien n'est projeté, c'est volontaire.",
        pas_de_declencheur:"Il manque le mot déclencheur « Apostle ».",
        verbe_manquant:"Il manque le verbe. Dites « Apostle, donne-moi… » ou « Apostle, montre-moi… ».",
        chapitre_inexistant:"Ce chapitre n'existe pas dans ce livre.",
        version_inconnue:"Cette version n'est pas au catalogue.",
        commande_vide:"Dites une référence après le mot déclencheur.",
        vide:"Commande vide."
      };
      etat.stats.abandons++;
      majStats();
      message(raisons[intention && intention.raison] || "Commande non reconnue.", "err");
      return;
    }

    switch(intention.type){
      case "passage":
        /* « verset quatre » ou « chapitre cinq » s'appuient sur ce qui est affiché */
        if(intention.contextuel){
          if(!etat.passage){
            message("Dites d'abord le livre, par exemple « Romains 2 ».", "err");
            return;
          }
          intention = {
            type:"passage",
            livreId: etat.passage.livreId,
            chapitre: intention.contextuel === "verset" ? etat.passage.chapitre : intention.chapitre,
            de: intention.de,
            a: intention.a,
            score: intention.score
          };
        }
        if(etat.confirmation){
          etat.proposition = intention;
          var lv = livre(intention.livreId);
          message("Proposition : " + lv.fr + " " + intention.chapitre +
                  (intention.de ? "."+intention.de+(intention.a&&intention.a!==intention.de?"-"+intention.a:"") : "") +
                  "  ·  Entrée pour projeter, Échap pour annuler");
          return;
        }
        projeter(intention);
        allerVue("projection");
        break;

      case "version":
        var v = versionPar(intention.version);
        if(v.statut === "licence"){
          message("« " + v.nom + " » demande une licence que cette église ne détient pas. Rien n'est changé.", "err");
          allerVue("bible");
          return;
        }
        choisirVersion(v.id);
        message("Version : " + v.nom, "ok");
        break;

      case "langue":
        var cible = intention.langue === "en" ? "kjv" : "lsg";
        choisirVersion(cible);
        message("Langue : " + (intention.langue==="en" ? "anglais" : "français") + ", version " + versionPar(cible).nom, "ok");
        break;

      case "nav":
        pageDelta(intention.direction);
        break;

      case "noir":
        basculerNoir();
        break;

      case "strong":
        var trouves = chercherStrong(intention);
        motStrong = intention.mot || (trouves.length ? trouves[0].mots[0] : "");

        /* Aucune entrée du lexique ne correspond : on ne renvoie pas une page
           vide, on montre les versets où le mot apparaît réellement. */
        if(!trouves.length){
          if(!motStrong){ message("Dites le mot à chercher, par exemple « le strong du mot manger ».", "err"); return; }
          var res = afficherConcordanceSeule(motStrong);
          allerVue("strong");
          message(res
            ? "« " + motStrong + " » n'est pas dans le lexique Strong embarqué, voici les " + res + " versets où il apparaît."
            : "Aucune occurrence de « " + motStrong + " » dans " + versionPar(etat.version).nom + ".",
            res ? "" : "err");
          return;
        }
        afficherStrong(trouves[0].code);
        projeterStrong(trouves[0].code);
        allerVue("strong");
        message(trouves.length > 1
          ? trouves.length + " entrées Strong pour « " + motStrong + " », la première est projetée."
          : "Strong " + trouves[0].code + " · " + trouves[0].tr + ", projeté.", "ok");
        break;

      case "recherche":
        var terme = P.normaliser(intention.terme);
        var trouve = [];
        Object.keys(STRONG).forEach(function(k){
          if(STRONG[k].mots.some(function(m){ return P.normaliser(m).indexOf(terme)>=0; })) trouve.push(k);
        });
        if(trouve.length){ afficherStrong(trouve[0]); allerVue("strong"); message("Occurrences de « "+intention.terme+" »", "ok"); }
        else message("La recherche par mot arrive en version 2. Terme demandé : « " + intention.terme + " ».", "err");
        break;

      default:
        message("Commande reconnue mais non gérée dans cette maquette.", "err");
    }
  }

  function resumeIntention(i){
    if(i.type === "passage"){
      if(i.contextuel) return (i.contextuel === "verset" ? "verset " : "chapitre ") + (i.de || i.chapitre);
      var lv = livre(i.livreId);
      return (lv ? lv.fr : i.livreId) + " " + i.chapitre + (i.de ? "." + i.de : "");
    }
    if(i.type === "strong")  return "strong";
    if(i.type === "version") return "version";
    if(i.type === "langue")  return "langue";
    if(i.type === "nav")     return "page";
    if(i.type === "noir")    return "écran noir";
    return i.type;
  }

  var motStrong = "";

  /* Renvoie toutes les entrées qui correspondent, pas seulement la meilleure :
     « servir » se dit de plusieurs façons en grec et en hébreu, et c'est
     justement ce que le lexique Strong permet de voir. */
  function chercherStrong(intention){
    var cles = Object.keys(STRONG);

    if(intention.code && STRONG[intention.code]) return [STRONG[intention.code]];
    if(intention.numero !== undefined){
      var r = [];
      if(STRONG["G" + intention.numero]) r.push(STRONG["G" + intention.numero]);
      if(STRONG["H" + intention.numero]) r.push(STRONG["H" + intention.numero]);
      if(r.length) return r;
    }
    if(!intention.mot) return [];

    var m = P.normaliser(intention.mot);
    var exacts = [], proches = [];
    cles.forEach(function(k){
      var e = STRONG[k], meilleur = 99;
      e.mots.forEach(function(w){
        var n = P.normaliser(w);
        var d = P.distance(n, m);
        if(n.indexOf(m) === 0 || m.indexOf(n) === 0) d = 0;
        if(d < meilleur) meilleur = d;
      });
      if(meilleur === 0) exacts.push(e);
      else if(meilleur <= 2) proches.push({e:e, d:meilleur});
    });
    if(exacts.length) return exacts;
    proches.sort(function(x, y){ return x.d - y.d; });
    return proches.slice(0, 3).map(function(x){ return x.e; });
  }

  /* ------------------------------------------------------------------
     Concordance réelle : les occurrences sont cherchées dans le texte
     biblique embarqué, pas dans une liste écrite à la main.
     ------------------------------------------------------------------ */
  var indexTexte = null;

  function construireIndexTexte(version){
    var B = BIBLE[version], out = [];
    if(!B) return out;
    Object.keys(B).forEach(function(b){
      B[b].forEach(function(ch, ci){
        ch.forEach(function(t, vi){
          if(t) out.push({b:b, c:ci+1, v:vi+1, n:P.normaliser(t), t:t});
        });
      });
    });
    return out;
  }

  function occurrences(racine, limite){
    var version = etat.version;
    if(!indexTexte || indexTexte.version !== version)
      indexTexte = {version:version, liste:construireIndexTexte(version)};
    var r = P.normaliser(racine).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if(!r) return {total:0, liste:[]};
    var re = new RegExp("\\b" + r);
    var liste = [], total = 0;
    for(var i = 0; i < indexTexte.liste.length; i++){
      if(re.test(indexTexte.liste[i].n)){
        total++;
        if(liste.length < (limite || 12)) liste.push(indexTexte.liste[i]);
      }
    }
    return {total:total, liste:liste};
  }

  /* Repli : le mot n'a pas d'entrée Strong, mais il est dans le texte. */
  function afficherConcordanceSeule(mot){
    var f = $("strong-fiche");
    if(!f) return 0;
    var racine = P.normaliser(mot);
    if(racine.length > 5) racine = racine.slice(0, racine.length - 2);
    var occ = occurrences(racine, 20);

    var html = '<div class="strong-tete"><span class="strong-orig" style="font-size:30px">« ' +
               escapeHtml(mot) + ' »</span></div>' +
               '<p class="sous" style="margin-top:10px">Ce mot n\'a pas encore d\'entrée dans le lexique Strong embarqué. ' +
               'Voici les versets où la racine « ' + escapeHtml(racine) + ' » apparaît dans ' +
               versionPar(etat.version).nom + '.</p>';

    if(occ.total){
      html += '<div class="etiq" style="margin-top:18px">' + occ.total + ' versets' +
              (occ.total > occ.liste.length ? ", les " + occ.liste.length + " premiers" : "") + '</div>' +
              '<ul class="liste occ-versets">' + occ.liste.map(function(o){
                var lv = livre(o.b);
                return '<li data-b="' + o.b + '" data-c="' + o.c + '" data-v="' + o.v + '">' +
                       '<span><b>' + (lv ? nomLivre(lv) : o.b) + " " + o.c + "." + o.v + '</b>' +
                       '<span class="apercu">' + escapeHtml(o.t.slice(0, 95)) + (o.t.length > 95 ? "…" : "") + '</span></span>' +
                       '<button>projeter</button></li>';
              }).join("") + '</ul>';
    } else {
      html += '<p class="sous" style="margin-top:14px">Aucune occurrence trouvée.</p>';
    }
    f.innerHTML = html;
    [].forEach.call(f.querySelectorAll(".occ-versets li"), function(li){
      li.querySelector("button").addEventListener("click", function(){
        var c = parseInt(li.dataset.c, 10), v = parseInt(li.dataset.v, 10);
        if(projeter({livreId:li.dataset.b, chapitre:c, de:v, a:v})) allerVue("projection");
      });
    });
    return occ.total;
  }

  /* ---------- affichage de la fiche ---------- */
  function afficherStrong(code){
    var e = STRONG[code];
    if(!e) return;
    var f = $("strong-fiche");
    if(!f) return;

    var famille = motStrong ? chercherStrong({mot:motStrong}) : [e];
    if(!famille.length || famille.indexOf(e) < 0) famille = [e];

    var html =
      '<div class="strong-tete">' +
        '<span class="strong-code">' + e.code + '</span>' +
        '<span class="strong-orig">' + e.orig + '</span>' +
        '<span class="strong-tr">' + e.tr + '</span>' +
      '</div>' +
      '<dl class="def">' +
        '<dt>langue</dt><dd>' + e.langue + '</dd>' +
        '<dt>prononciation</dt><dd>' + e.pron + '</dd>' +
        '<dt>définition</dt><dd>' + escapeHtml(e.sens) + '</dd>' +
        '<dt>étymologie</dt><dd>' + e.etym + '</dd>' +
        '<dt>traduit par</dt><dd>' + e.mots.join(", ") + '</dd>' +
      '</dl>' +
      '<div style="margin-top:14px"><button class="cmd rouge" id="projeter-strong">Projeter cette fiche</button></div>';

    if(famille.length > 1){
      html += '<div class="etiq" style="margin-top:20px">les ' + famille.length +
              ' mots d\'origine derrière « ' + escapeHtml(motStrong) + ' »</div>' +
              '<div class="famille">' + famille.map(function(x){
                return '<button class="mot-origine' + (x.code === e.code ? " actif" : "") +
                       '" data-code="' + x.code + '">' +
                       '<b>' + x.orig + '</b><span>' + x.tr + '</span>' +
                       '<em>' + x.code + '</em></button>';
              }).join("") + '</div>';
    }

    var occ = motStrong ? occurrences(e.racine || motStrong, 12) : {total:0, liste:[]};
    if(occ.total){
      html += '<div class="etiq" style="margin-top:20px">' + occ.total +
              ' versets contiennent la racine « ' + escapeHtml(e.racine || motStrong) + ' » dans ' + versionPar(etat.version).nom +
              (occ.total > occ.liste.length ? ", les " + occ.liste.length + " premiers" : "") + '</div>' +
              '<ul class="liste occ-versets">' + occ.liste.map(function(o){
                var lv = livre(o.b);
                return '<li data-b="' + o.b + '" data-c="' + o.c + '" data-v="' + o.v + '">' +
                       '<span><b>' + (lv ? nomLivre(lv) : o.b) + " " + o.c + "." + o.v + '</b>' +
                       '<span class="apercu">' + escapeHtml(o.t.slice(0, 95)) + (o.t.length > 95 ? "…" : "") + '</span></span>' +
                       '<button>projeter</button></li>';
              }).join("") + '</ul>';
    }

    html += '<p class="sous" style="margin-top:16px">Les occurrences sont calculées sur le texte embarqué. ' +
            'Le lien entre le mot français et le numéro Strong est une table établie à la main : ' +
            'un alignement verset par verset demande un corpus balisé, comme le jeu STEPBible.</p>';

    f.innerHTML = html;

    var bp = $("projeter-strong");
    if(bp) bp.addEventListener("click", function(){ projeterStrong(e.code); allerVue("projection"); });

    [].forEach.call(f.querySelectorAll(".mot-origine"), function(b){
      b.addEventListener("click", function(){ afficherStrong(b.dataset.code); projeterStrong(b.dataset.code); });
    });
    [].forEach.call(f.querySelectorAll(".occ-versets li"), function(li){
      li.querySelector("button").addEventListener("click", function(){
        var c = parseInt(li.dataset.c, 10), v = parseInt(li.dataset.v, 10);
        if(projeter({livreId:li.dataset.b, chapitre:c, de:v, a:v})) allerVue("projection");
      });
    });

    [].forEach.call($("strong-liste").querySelectorAll("li"), function(li){
      li.style.background = li.dataset.code === code ? "var(--bleu-pale)" : "";
    });
  }

  function rendreStrongListe(){
    var ul = $("strong-liste");
    if(!ul) return;
    ul.innerHTML = "";
    Object.keys(STRONG).forEach(function(k){
      var e = STRONG[k];
      var li = document.createElement("li");
      li.dataset.code = k;
      li.innerHTML = '<b>' + e.orig + '  <span style="font-weight:normal;color:var(--gris)">' + e.tr +
                     '</span></b><span class="heure">' + e.code + '</span>';
      li.style.cursor = "pointer";
      li.addEventListener("click", function(){ motStrong = e.mots[0]; afficherStrong(k); });
      ul.appendChild(li);
    });
  }

  /* ---------- navigation ---------- */
  function allerVue(id){
    etat.vue = id;
    [].forEach.call(document.querySelectorAll(".vue"), function(s){
      s.classList.toggle("actif", s.id === "vue-"+id);
    });
    [].forEach.call(document.querySelectorAll(".nav-item"), function(b){
      b.classList.toggle("actif", b.dataset.vue === id);
    });
    $("app").querySelector(".zone").scrollTop = 0;
  }

  function pageDelta(d){
    if(!etat.pages.length) return;
    var n = etat.page + d;
    if(n<0 || n>=etat.pages.length){ message("Fin du passage.", ""); return; }
    etat.page = n;
    rendreScene(true);
  }

  function basculerNoir(){
    etat.noir = !etat.noir;
    $("scene").classList.toggle("noire", etat.noir);
    message(etat.noir ? "Écran noir." : "Retour au passage.", "");
  }

  function choisirVersion(id){
    etat.version = id;
    $("select-version").value = id;
    rendreVersions();
    construirePages();
    rendreScene(true);
    rendreNavigateur();
  }

  /* ---------- rendus secondaires ---------- */
  function rendreThemes(){
    var w = $("themes");
    w.innerHTML = "";
    THEMES.forEach(function(t){
      var b = document.createElement("button");
      b.className = "pastille";
      b.type = "button";
      b.setAttribute("aria-pressed", t.id===etat.theme ? "true":"false");
      b.innerHTML = '<i style="background:'+t.apercu+'"></i><span>'+t.nom+'</span>';
      b.addEventListener("click", function(){
        etat.theme = t.id;
        rendreThemes();
        rendreScene(false);
      });
      w.appendChild(b);
    });
  }

  function rendreVersions(){
    var w = $("versions");
    if(w){
      w.innerHTML = "";
      VERSIONS.forEach(function(v){
        var d = document.createElement("div");
        d.className = "version" + (v.id===etat.version ? " active" : "");
        var badge = v.id===etat.version ? '<span class="badge b-actif">en cours</span>'
                  : v.statut==="libre" ? '<span class="badge b-libre">domaine public</span>'
                  : '<span class="badge b-licence">licence requise</span>';
        d.innerHTML = '<div><div class="n">'+v.nom+'</div><div class="d">'+v.mention+'</div></div>'+badge;
        if(v.statut==="libre"){
          d.style.cursor = "pointer";
          d.addEventListener("click", function(){ choisirVersion(v.id); message("Version : "+v.nom, "ok"); });
        } else {
          d.addEventListener("click", function(){
            message("« "+v.nom+"  » demande une licence. Le serveur refuse l'affichage tant qu'elle n'est pas activée.", "err");
          });
        }
        w.appendChild(d);
      });
    }
    var s = $("select-version");
    if(s && !s.dataset.pret){
      VERSIONS.forEach(function(v){
        var o = document.createElement("option");
        o.value = v.id;
        o.textContent = v.nom + (v.statut==="licence" ? " (licence)" : "");
        o.disabled = v.statut==="licence";
        s.appendChild(o);
      });
      s.dataset.pret = "1";
      s.addEventListener("change", function(){ choisirVersion(s.value); });
    }
    if(s) s.value = etat.version;
  }

  var navLivre = null;

  function rendreNavigateur(){
    var fil = $("fil"), nav = $("navigateur");
    if(!fil || !nav) return;
    fil.innerHTML = ""; nav.innerHTML = "";

    if(!navLivre){
      nav.className = "nav-bible livres";
      var ici = document.createElement("span");
      ici.className = "ici";
      ici.textContent = "Les 66 livres, " + versionPar(etat.version).nom;
      fil.appendChild(ici);
      [["ancien testament", 0, 39], ["nouveau testament", 39, 66]].forEach(function(g){
        var t = document.createElement("div");
        t.className = "titre-groupe"; t.textContent = g[0];
        nav.appendChild(t);
        window.APOSTLE_BOOKS.slice(g[1], g[2]).forEach(function(b){
          var btn = document.createElement("button");
          btn.type = "button";
          btn.innerHTML = escapeHtml(nomLivre(b)) + ' <em>' + b.ch + '</em>';
          btn.addEventListener("click", function(){ navLivre = b; rendreNavigateur(); });
          nav.appendChild(btn);
        });
      });
      return;
    }

    var b = navLivre;
    nav.className = "nav-bible chapitres";
    var retour = document.createElement("button");
    retour.type = "button";
    retour.textContent = "tous les livres";
    retour.addEventListener("click", function(){ navLivre = null; rendreNavigateur(); });
    fil.appendChild(retour);
    var titre = document.createElement("span");
    titre.className = "ici";
    titre.textContent = nomLivre(b) + ", " + b.ch + (b.ch > 1 ? " chapitres" : " chapitre");
    fil.appendChild(titre);

    for(var c = 1; c <= b.ch; c++){
      (function(c){
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = c;
        btn.addEventListener("click", function(){
          if(projeter({livreId:b.id, chapitre:c, de:null, a:null})) allerVue("projection");
        });
        nav.appendChild(btn);
      })(c);
    }
  }





  function rendrePuces(){
    var w = $("puces");
    EXEMPLES.forEach(function(x){
      var b = document.createElement("button");
      b.className = "puce";
      b.type = "button";
      b.textContent = x;
      b.addEventListener("click", function(){ lancer(x, true); });
      w.appendChild(b);
    });
  }

  /* ---------- entrée des commandes ---------- */
  function lancer(texte, forcerDeclencheur){
    var intention = P.analyser(texte, etat.mode === "libre"
      ? {mode:"libre", source:"clavier"}
      : {exigerDeclencheur: forcerDeclencheur ? true : etat.exigerDeclencheur,
         exigerVerbe: forcerDeclencheur ? etat.exigerVerbe : false});

    if(!intention || !intention.type){
      var sugg = P.suggestions(texte, 3);
      noterJournal(texte, sugg.length ? "non reconnu" : "ignoré", false);
      if(sugg.length) proposer(texte);
      executer(intention);
      return;
    }
    cacherPropositions();
    noterJournal(texte, resumeIntention(intention), true);
    executer(intention);
  }

  function envoyerSaisie(){
    var v = $("saisie").value.trim();
    if(!v) return;
    lancer(v, false);
    $("saisie").value = "";
  }

  /* ---------- micro ---------- */
  var reco = null, recoDispo = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  /* Pourquoi le micro peut refuser de démarrer, et quoi faire. */
  function obstacles(){
    var o = [];
    if(!recoDispo)
      o.push("Ce navigateur n'a pas de reconnaissance vocale intégrée. Ouvrez la page dans Chrome, Edge ou Brave.");
    if(location.protocol === "file:")
      o.push("Le fichier est ouvert directement depuis le disque. Les navigateurs coupent le micro dans ce cas. Lancez le petit serveur fourni, puis ouvrez localhost.");
    else if(!window.isSecureContext)
      o.push("La page n'est pas servie en https. Le navigateur bloque le micro hors connexion sécurisée.");
    return o;
  }

  /* Avertissements : on laisse quand même tenter, le navigateur tranchera. */
  function avertissements(){
    var o = [];
    if(window.self !== window.top)
      o.push("La page est affichée dans un cadre. Si le micro est refusé, ouvrez-la dans un onglet à part.");
    return o;
  }

  function rendreDiagnostic(){
    var d = $("diagnostic");
    if(!d) return;
    var o = obstacles();
    if(!o.length){
      d.className = "diag ok";
      d.innerHTML = "<b>Le micro peut fonctionner ici.</b>" +
        "Cliquez une fois sur le micro et autorisez l'accès. Il reste ensuite ouvert pour " +
        "toute la session. Dites la référence, elle s'affiche sans attendre la fin de la phrase." +
        (etat.mode === "libre"
          ? "<div style=\"margin-top:7px;color:rgba(255,255,255,.8)\">Sans mot déclencheur, " +
            "la transcription tourne en continu : la parole est donc transmise au service de " +
            "reconnaissance pendant toute la session. Le mode sécurisé, dans les réglages, " +
            "la limite aux seules commandes.</div>"
          : "");
      return;
    }
    d.className = "diag";
    d.innerHTML = "<b>Le micro ne pourra pas démarrer ici</b><ul>" +
      o.map(function(x){ return "<li>" + x + "</li>"; }).join("") +
      "</ul><div style=\"margin-top:7px;color:rgba(255,255,255,.8)\">" +
      "En attendant, la barre de commande en bas suit exactement le même chemin d'analyse " +
      "que la voix : tapez « Romains 2 verset 3 » et validez.</div>";
  }

  var reco = null, tamponTexte = "", derniereSig = "", derniereT = 0;
  var vadActif = false, recoBloquee = false, recoRetente = false;

  function majMicro(){
    var on = etat.ecoute;
    $("micro-grand").classList.toggle("on", on);
    $("micro-mini").classList.toggle("on", on);
    $("vu").classList.toggle("on", on);
    $("vu").classList.toggle("mesure", on && vadActif);
    $("micro-grand").classList.toggle("veille", on && etat.veille);

    var e = $("etat-micro");
    if(!on){ e.textContent = "micro en attente, cliquez pour activer"; return; }
    if(recoBloquee){ e.textContent = "micro ouvert, mais la transcription est indisponible"; return; }
    if(etat.veille){ e.textContent = "en veille, le détecteur local écoute toujours"; return; }
    if(etat.parole){ e.textContent = "parole détectée…"; return; }
    e.textContent = "à l'écoute, dites « Apostle, donne-moi… »";
  }

  function dessinerNiveau(d){
    var barres = $("vu").children, h = d.historique, n = barres.length;
    for(var i = 0; i < n; i++){
      var v = h[h.length - n + i];
      var p = (v === undefined) ? 0 : Math.min(1, v / 0.22);
      barres[i].style.height = (3 + p * 28) + "px";
      barres[i].style.background = d.parole ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.5)";
    }
  }

  function viderNiveau(){
    [].forEach.call($("vu").children, function(b){
      b.style.height = ""; b.style.background = "";
    });
  }

  /* ---------- transcription ---------- */
  function demarrerReco(){
    if(reco || !recoDispo || !etat.ecoute || recoBloquee) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    try{
      reco = new SR();
      reco.lang = versionPar(etat.version).langue === "en" ? "en-US" : "fr-FR";
      reco.continuous = true;
      reco.interimResults = true;
      reco.onstart = function(){ dernierSigneDeVie = Date.now(); };
      reco.onresult = function(ev){
        dernierSigneDeVie = Date.now();
        for(var i = ev.resultIndex; i < ev.results.length; i++){
          var t = ev.results[i][0].transcript;
          if(ev.results[i].isFinal){
            annulerAnticipation();
            tamponTexte = "";
            traiter(t, "final");
          } else {
            tamponTexte = t;
            if(!etat.veille) $("etat-micro").textContent = "… " + t;
            anticiper(t);
          }
        }
      };
      reco.onerror = function(ev){
        var err = ev.error;
        /* en écoute continue, ces deux là sont la normalité, pas une panne */
        dernierSigneDeVie = Date.now();
        if(err === "no-speech" || err === "aborted") return;

        /* le détecteur de niveau peut tenir le micro et empêcher la transcription :
           on le relâche et on retente une fois avant d'abandonner */
        if((err === "audio-capture" || err === "not-allowed") && vadActif && !recoRetente){
          recoRetente = true;
          if(window.APOSTLE_ECOUTE) window.APOSTLE_ECOUTE.arreter();
          vadActif = false;
          arreterReco();
          majMicro();
          message("Le micro était occupé par l'analyse du niveau sonore. Je la coupe et je relance la reconnaissance.", "");
          setTimeout(demarrerReco, 400);
          return;
        }

        /* le micro lui-même est hors jeu : on arrête tout */
        if(err === "not-allowed" || (err === "audio-capture" && !vadActif)){
          message(err === "not-allowed"
            ? "Le navigateur a refusé le micro. Cliquez sur l'icône à gauche de la barre d'adresse et autorisez le microphone pour ce site."
            : "Aucun micro détecté. Branchez un micro ou choisissez une autre entrée audio.", "err");
          arreterEcoute();
          return;
        }

        /* seule la transcription est indisponible : le micro et le détecteur
           local continuent, exactement comme en cas de coupure réseau en plein culte */
        recoBloquee = true;
        arreterReco();
        majMicro();
        message(err === "network"
          ? "La transcription a besoin d'une connexion et l'a perdue. Le micro reste ouvert, la barre de commande reste disponible."
          : "Le service de reconnaissance du navigateur a refusé la demande. Le micro reste ouvert, utilisez la barre de commande.", "err");
      };
      reco.onend = function(){
        reco = null;
        dernierSigneDeVie = Date.now();
        if(etat.ecoute && !etat.veille && !recoBloquee) setTimeout(demarrerReco, 120);
      };
      reco.start();
    }catch(e){ reco = null; }
  }

  /* On n'attend pas que le service finalise la phrase : dès que la
     transcription partielle cesse de changer pendant un court instant,
     la référence est projetée. */
  var minuteurAnticipe = null;

  function anticiper(texte){
    if(etat.mode !== "libre") return;
    clearTimeout(minuteurAnticipe);
    minuteurAnticipe = setTimeout(function(){ traiter(texte, "anticipe"); }, 280);
  }
  function annulerAnticipation(){
    clearTimeout(minuteurAnticipe);
    minuteurAnticipe = null;
  }

  function arreterReco(){
    if(!reco) return;
    try{ reco.onend = null; reco.onresult = null; reco.onerror = null; reco.stop(); }catch(e){}
    reco = null;
  }

  /* Une même commande peut arriver deux fois : une fois anticipée sur la
     transcription partielle dès la fin de la phrase, une fois à la
     finalisation. On ne l'exécute qu'une seule fois. */
  function traiter(texte, origine){
    if(!texte || !texte.trim()) return;
    var intention = P.analyser(texte, etat.mode === "libre"
      ? {mode:"libre"}
      : {exigerDeclencheur:true, exigerVerbe:etat.exigerVerbe});

    if(!intention || !intention.type){
      if(origine === "final" || origine === "clavier"){
        var sugg = P.suggestions(texte, 3);
        noterJournal(texte, sugg.length ? "non reconnu" : "ignoré", false);
        if(sugg.length) proposer(texte);
      }
      if(etat.mode !== "libre" && origine === "final" &&
         /apost|donne|montre/.test(P.normaliser(texte))) executer(intention);
      return;
    }
    cacherPropositions();
    var sig = JSON.stringify([intention.type, intention.livreId, intention.chapitre,
                              intention.de, intention.a, intention.version, intention.langue,
                              intention.code, intention.mot, intention.numero, intention.direction]);
    var maintenant = Date.now();
    if(sig === derniereSig && maintenant - derniereT < 3500) return;
    derniereSig = sig; derniereT = maintenant;
    $("etat-micro").textContent = "entendu : " + texte;
    noterJournal(texte, resumeIntention(intention), true);
    executer(intention);
  }

  /* ------------------------------------------------------------------
     Journal d'écoute : la transcription brute et ce qu'on en a fait.
     ------------------------------------------------------------------ */
  var journal = [];

  function noterJournal(texte, resultat, ok){
    var d = new Date();
    journal.unshift({
      h: ("0"+d.getHours()).slice(-2)+":"+("0"+d.getMinutes()).slice(-2)+":"+("0"+d.getSeconds()).slice(-2),
      dit: texte, res: resultat, ok: !!ok
    });
    journal = journal.slice(0, 12);
    rendreJournal();
  }

  function rendreJournal(){
    var ul = $("journal");
    if(!ul) return;
    if(!journal.length){
      ul.innerHTML = '<li><span class="sous">rien entendu pour l\'instant</span></li>';
      return;
    }
    ul.innerHTML = journal.map(function(e){
      return '<li><span class="dit">« ' + escapeHtml(e.dit) + ' »</span>' +
             '<span class="res ' + (e.ok ? "oui" : "non") + '">' + escapeHtml(e.res) + '</span>' +
             '<span class="heure">' + e.h + '</span></li>';
    }).join("");
  }

  /* ------------------------------------------------------------------
     Rattrapage : quand rien n'est reconnu mais qu'un nombre a été
     entendu, on propose les livres les plus proches, en un clic.
     ------------------------------------------------------------------ */
  function proposer(texte){
    var zone = $("propositions");
    if(!zone) return;
    var liste = P.suggestions(texte, 3);
    if(!liste.length){ zone.hidden = true; return; }

    zone.innerHTML = '<span class="lab">pas sûr d\'avoir compris, vouliez-vous dire</span>';
    liste.forEach(function(r){
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = r.livre + " " + r.chapitre + (r.de ? "." + r.de + (r.a && r.a !== r.de ? "-" + r.a : "") : "");
      b.addEventListener("click", function(){
        zone.hidden = true;
        if(projeter({livreId:r.livreId, chapitre:r.chapitre, de:r.de, a:r.a})) allerVue("projection");
      });
      zone.appendChild(b);
    });
    zone.hidden = false;
    clearTimeout(proposer.minuteur);
    proposer.minuteur = setTimeout(function(){ zone.hidden = true; }, 15000);
  }

  function cacherPropositions(){
    var z = $("propositions");
    if(z) z.hidden = true;
  }

  /* ---------- écoute continue ---------- */
  function brancherEcoute(){
    var E = window.APOSTLE_ECOUTE;
    if(!E) return;
    E.sur("niveau", dessinerNiveau);
    E.sur("debutParole", function(){
      etat.parole = true;
      majMicro();
    });
    E.sur("finParole", function(){
      etat.parole = false;
      majMicro();
      /* la phrase est finie : on agit sans attendre la finalisation du service */
      annulerAnticipation();
      if(tamponTexte){ var t = tamponTexte; tamponTexte = ""; traiter(t, "anticipe"); }
    });
    E.sur("veille", function(){
      etat.veille = true;
      arreterReco();
      majMicro();
      message("Silence prolongé. La transcription est suspendue, le détecteur local reste actif et réveille tout au premier mot.", "");
    });
    E.sur("reveil", function(){
      etat.veille = false;
      demarrerReco();
      majMicro();
    });
  }

  function basculerMicro(){
    if(etat.ecoute){ arreterEcoute(); return; }
    var o = obstacles();
    if(o.length){ message(o[0], "err"); rendreDiagnostic(); return; }

    etat.ecoute = true; etat.parole = false; etat.veille = false;
    recoBloquee = false; recoRetente = false;
    majMicro();
    message("Micro ouvert. Dites une référence, par exemple « Jean 3 verset 16 ».", "ok");

    demarrerReco();
    demarrerChien();

    /* Le détecteur de niveau ouvre un second accès au micro. Beaucoup de
       postes n'en acceptent qu'un, et c'est la transcription qui saute.
       Il reste donc désactivé sauf demande explicite. */
    if(etat.niveauSonore){
      setTimeout(function(){
        if(!etat.ecoute || recoBloquee) return;
        var E = window.APOSTLE_ECOUTE;
        if(!E) return;
        E.demarrer().then(function(){
          if(!etat.ecoute){ E.arreter(); return; }
          vadActif = true; majMicro();
        }).catch(function(){ vadActif = false; majMicro(); });
      }, 900);
    }
  }

  /* ------------------------------------------------------------------
     Chien de garde : Chrome arrête la reconnaissance tout seul, au bout
     d'un silence ou d'une minute, et parfois sans prévenir. On vérifie
     toutes les trois secondes qu'elle tourne encore, et on la relance.
     ------------------------------------------------------------------ */
  var chien = null, dernierSigneDeVie = 0;

  function demarrerChien(){
    arreterChien();
    dernierSigneDeVie = Date.now();
    chien = setInterval(function(){
      if(!etat.ecoute || etat.veille) return;

      /* une panne réseau est passagère : on retente au bout de dix secondes */
      if(recoBloquee && Date.now() - dernierSigneDeVie > 10000){
        recoBloquee = false;
        majMicro();
      }
      if(recoBloquee) return;

      if(!reco){ demarrerReco(); return; }

      /* la reconnaissance existe mais ne donne plus signe de vie */
      if(Date.now() - dernierSigneDeVie > 25000){
        arreterReco();
        setTimeout(demarrerReco, 200);
        dernierSigneDeVie = Date.now();
      }
    }, 3000);
  }
  function arreterChien(){ clearInterval(chien); chien = null; }

  function arreterEcoute(){
    etat.ecoute = false; etat.parole = false; etat.veille = false; recoBloquee = false;
    arreterChien();
    tamponTexte = "";
    annulerAnticipation();
    arreterReco();
    if(window.APOSTLE_ECOUTE) window.APOSTLE_ECOUTE.arreter();
    vadActif = false;
    viderNiveau();
    majMicro();
  }


  /* ============================================================
     Test du micro : six secondes pour savoir exactement ce qui
     marche et ce qui ne marche pas sur ce poste.
     ============================================================ */
  function testerMicro(){
    var zone = $("resultat-test");
    var btn = $("btn-test");
    if(!zone) return;
    zone.hidden = false;
    btn.disabled = true;
    btn.textContent = "test en cours…";

    var r = {autorisation:"en attente", niveau:0, reco:"en attente", texte:"", erreur:""};
    function peindre(verdict){
      zone.innerHTML =
        '<b>Test du micro</b>' +
        '<div class="ligne-test"><span>Autorisation du navigateur</span><span class="v">' + r.autorisation + '</span></div>' +
        '<div class="ligne-test"><span>Son capté</span><span class="v">' +
          (r.niveau > 0.02 ? "oui, niveau " + Math.round(r.niveau * 400) + " %" :
           r.niveau > 0 ? "très faible" : "aucun") + '</span></div>' +
        '<div class="ligne-test"><span>Reconnaissance vocale</span><span class="v">' + r.reco + '</span></div>' +
        (r.texte ? '<div class="ligne-test"><span>Entendu</span><span class="v">« ' + escapeHtml(r.texte) + ' »</span></div>' : '') +
        (verdict ? '<div class="verdict">' + verdict + '</div>' : '');
    }
    peindre("Parlez maintenant, dites « Jean 3 verset 16 ».");

    var ctx = null, flux = null, minuteur = null, reconn = null;

    function terminer(){
      clearInterval(minuteur);
      if(flux) flux.getTracks().forEach(function(t){ t.stop(); });
      if(ctx && ctx.close) { try{ ctx.close(); }catch(e){} }
      if(reconn){ try{ reconn.onend = null; reconn.stop(); }catch(e){} }
      btn.disabled = false;
      btn.textContent = "Tester le micro";

      var v;
      if(r.autorisation === "refusée")
        v = "Le navigateur refuse le micro. Cliquez sur l'icône à gauche de l'adresse, mettez le microphone sur « Autoriser », puis rechargez la page.";
      else if(r.niveau <= 0.01)
        v = "Le micro est autorisé mais aucun son n'arrive. Vérifiez l'entrée choisie dans les réglages son de l'ordinateur, et que le micro n'est pas coupé.";
      else if(r.texte)
        v = "Tout fonctionne. Vous pouvez activer le micro et dicter vos références.";
      else if(r.reco === "indisponible")
        v = "Le son arrive bien, mais ce navigateur n'a pas de reconnaissance vocale. Utilisez Chrome, Edge ou Brave.";
      else if(r.erreur === "audio-capture")
        v = "Le son arrive, mais la reconnaissance n'a pas pu prendre le micro. Il est sans doute déjà utilisé par un autre onglet ou une autre application. Fermez-les, puis réessayez.";
      else if(r.erreur === "network")
        v = "Le son arrive, mais la reconnaissance n'a pas de connexion. Elle a besoin d'internet pour fonctionner.";
      else
        v = "Le son arrive, mais aucun mot n'a été transcrit. La reconnaissance a besoin d'une connexion internet. Vérifiez-la, puis réessayez en parlant plus fort et plus près du micro.";
      peindre(v);
    }

    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      r.autorisation = "impossible ici";
      terminer();
      return;
    }

    navigator.mediaDevices.getUserMedia({audio:true}).then(function(f){
      flux = f;
      r.autorisation = "accordée";
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      var an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(flux).connect(an);
      var tampon = new Uint8Array(an.fftSize);
      minuteur = setInterval(function(){
        an.getByteTimeDomainData(tampon);
        var s = 0;
        for(var i = 0; i < tampon.length; i++){ var d = (tampon[i]-128)/128; s += d*d; }
        var rms = Math.sqrt(s / tampon.length);
        if(rms > r.niveau) r.niveau = rms;
        peindre("");
      }, 100);

      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR){ r.reco = "indisponible"; }
      else {
        try{
          reconn = new SR();
          reconn.lang = "fr-FR";
          reconn.continuous = true;
          reconn.interimResults = true;
          reconn.onstart = function(){ r.reco = "démarrée"; };
          reconn.onresult = function(ev){
            r.reco = "fonctionne";
            r.texte = ev.results[ev.results.length-1][0].transcript.trim();
          };
          reconn.onerror = function(ev){ r.erreur = ev.error; if(ev.error !== "no-speech") r.reco = "erreur, " + ev.error; };
          reconn.start();
        }catch(e){ r.reco = "n'a pas démarré"; }
      }
      setTimeout(terminer, 6000);
    }).catch(function(e){
      r.autorisation = (e && e.name === "NotAllowedError") ? "refusée" : "échec, " + (e && e.name);
      terminer();
    });
  }

  /* ============================================================
     Démonstration guidée : rejoue une suite de commandes comme si
     elles étaient dictées. Sert à présenter le produit même sans
     micro, et c'est annoncé comme une simulation.
     ============================================================ */
  var SCENARIO = [
    {dit:"Jean 3 verset 16",            note:"une référence complète"},
    {dit:"verset 17",                   note:"le contexte est retenu, le livre et le chapitre ne sont pas répétés"},
    {dit:"Romains chapitre 8 versets 28 à 32", note:"une plage, découpée en pages lisibles"},
    {dit:"la version King James",       note:"changement de traduction, le passage reste le même"},
    {dit:"en français",                 note:"retour au français"},
    {dit:"Psaume 91",                   note:"un chapitre entier"},
    {dit:"le ciel est bleu aujourd'hui", note:"ce n'est pas une référence, rien ne s'affiche"},
    {dit:"le strong du mot grâce",      note:"ouverture de la fiche lexicale"}
  ];
  var demoEnCours = false;

  function demonstration(){
    if(demoEnCours) return;
    demoEnCours = true;
    var btn = $("btn-demo");
    btn.disabled = true;
    btn.textContent = "démonstration…";
    allerVue("projection");

    var i = 0;
    function suivant(){
      if(i >= SCENARIO.length){
        demoEnCours = false;
        btn.disabled = false;
        btn.textContent = "Démonstration guidée";
        message("Démonstration terminée.", "ok");
        return;
      }
      var e = SCENARIO[i++];
      $("etat-micro").textContent = "simulation, entendu : " + e.dit;
      message("« " + e.dit + " »  ·  " + e.note, "");
      setTimeout(function(){
        lancer(e.dit, false);
        setTimeout(suivant, 2600);
      }, 700);
    }
    suivant();
  }

  /* ---------- clavier ---------- */
  document.addEventListener("keydown", function(e){
    var dansChamp = e.target && (e.target.tagName==="INPUT" || e.target.tagName==="SELECT" || e.target.tagName==="TEXTAREA");
    if(e.key==="Escape"){
      if(etat.proposition){ etat.proposition=null; etat.stats.abandons++; majStats(); message("Proposition annulée.",""); }
      if(dansChamp) e.target.blur();
      return;
    }
    if(e.key==="Enter"){
      if(etat.proposition){ var p=etat.proposition; etat.proposition=null; projeter(p); allerVue("projection"); e.preventDefault(); return; }
      if(e.target && e.target.id==="saisie"){ envoyerSaisie(); }
      return;
    }
    if(dansChamp) return;
    if(e.key==="ArrowRight"){ pageDelta(1); }
    else if(e.key==="ArrowLeft"){ pageDelta(-1); }
    else if(e.key==="b"||e.key==="B"){ basculerNoir(); }
    else if(e.key==="m"||e.key==="M"){ basculerMicro(); }
    else if(e.key==="f"||e.key==="F"){ pleinEcran(); }
  });

  function pleinEcran(){
    var el = $("enveloppe");
    if(document.fullscreenElement) document.exitFullscreen();
    else if(el.requestFullscreen) el.requestFullscreen().catch(function(){
      message("Le plein écran est bloqué dans ce contexte. Ouvrez l'application dans un onglet pour l'utiliser.", "err");
    });
  }

  /* ---------- démarrage ---------- */
  function demarrer(){
    rendreThemes();
    rendreVersions();
    rendreNavigateur();
    rendreStrongListe();
    rendreJournal();
    rendrePuces();
    afficherStrong("G5485");
    majStats();
    majMicro();
    rendreDiagnostic();
    brancherEcoute();

    /* état de travail réaliste à l'ouverture */
    etat.historique = [
      {ref:"Psaume 91.1-7", heure:"09:31", version:"lsg", p:{livreId:"PSA",chapitre:91,de:null,a:null}},
      {ref:"Jean 3.16", heure:"09:24", version:"lsg", p:{livreId:"JHN",chapitre:3,de:16,a:16}},
      {ref:"Matthieu 5.3-10", heure:"09:11", version:"lsg", p:{livreId:"MAT",chapitre:5,de:null,a:null}},
      {ref:"Ésaïe 40.31", heure:"09:04", version:"lsg", p:{livreId:"ISA",chapitre:40,de:31,a:31}}
    ];
    rendreHistorique();

    etat.passage = {livreId:"ROM", chapitre:2, de:3, a:3};
    construirePages();
    rendreScene(false);
    message("Prêt. Cliquez sur une commande, ou activez le micro.", "");

    /* commandes de l'interface */
    [].forEach.call(document.querySelectorAll("[data-vue]"), function(b){
      b.addEventListener("click", function(){ allerVue(b.dataset.vue); });
    });
    $("micro-grand").addEventListener("click", basculerMicro);
    if($("btn-test")) $("btn-test").addEventListener("click", testerMicro);
    if($("btn-demo")) $("btn-demo").addEventListener("click", demonstration);
    $("micro-mini").addEventListener("click", basculerMicro);
    $("envoyer").addEventListener("click", envoyerSaisie);
    $("btn-noir").addEventListener("click", basculerNoir);
    $("btn-plein").addEventListener("click", pleinEcran);
    $("btn-prec").addEventListener("click", function(){ pageDelta(-1); });
    $("btn-suiv").addEventListener("click", function(){ pageDelta(1); });

    $("taille").addEventListener("input", function(){
      etat.taille = parseFloat(this.value);
      $("taille-val").textContent = String(etat.taille).replace(".",",") + " %";
      construirePages();
      rendreScene(false);
    });
    $("taille-val").textContent = String(etat.taille).replace(".",",") + " %";

    $("reg-salle").addEventListener("change", function(){
      etat.taille = parseFloat(this.value);
      $("taille").value = etat.taille;
      $("taille-val").textContent = String(etat.taille).replace(".",",") + " %";
      construirePages();
      rendreScene(false);
    });
    $("reg-confirm").addEventListener("click", function(){
      etat.confirmation = !etat.confirmation;
      this.setAttribute("aria-pressed", etat.confirmation ? "true":"false");
    });
    $("reg-exiger").addEventListener("click", function(){
      etat.exigerDeclencheur = !etat.exigerDeclencheur;
      this.setAttribute("aria-pressed", etat.exigerDeclencheur ? "true":"false");
      document.querySelector(".champ .prefixe").style.opacity = etat.exigerDeclencheur ? "1" : ".45";
    });
    var forme = $("reg-forme");
    if(forme){
      forme.addEventListener("change", function(){
        etat.mode = this.value;
        etat.exigerVerbe = true;
        rendreDiagnostic();
        var pref = document.querySelector(".champ .prefixe");
        pref.textContent = etat.mode === "libre" ? "" : "Apostle, donne-moi";
        pref.style.display = etat.mode === "libre" ? "none" : "";
        $("saisie").placeholder = etat.mode === "libre"
          ? "Romains 2 verset 3" : "Romains 2 verset 3, après « Apostle, donne-moi »";
        message(etat.mode === "libre"
          ? "Dites simplement la référence : « Romains 2 verset 3 ». Rien d'autre à prononcer."
          : "Mot déclencheur obligatoire : « Apostle, donne-moi Romains 2 verset 3 ».", "ok");
      });
    }

    var niv = $("reg-niveau");
    if(niv){
      niv.addEventListener("click", function(){
        etat.niveauSonore = !etat.niveauSonore;
        this.setAttribute("aria-pressed", etat.niveauSonore ? "true" : "false");
        if(!etat.niveauSonore && window.APOSTLE_ECOUTE){
          window.APOSTLE_ECOUTE.arreter();
          vadActif = false; majMicro();
        }
        message(etat.niveauSonore
          ? "Analyse du niveau sonore activée. Si la reconnaissance s'arrête, désactivez-la."
          : "Analyse du niveau sonore désactivée. Un seul accès au micro, c'est le plus fiable.", "");
      });
    }

    var sensi = $("reg-sensi");
    if(sensi){
      sensi.addEventListener("input", function(){
        var v = parseFloat(this.value);
        $("reg-sensi-val").textContent = v.toFixed(1).replace(".", ",");
        if(window.APOSTLE_ECOUTE) window.APOSTLE_ECOUTE.regler({seuil:v});
      });
    }
    var veille = $("reg-veille");
    if(veille){
      veille.addEventListener("change", function(){
        if(window.APOSTLE_ECOUTE) window.APOSTLE_ECOUTE.regler({veilleApres:parseInt(this.value,10)});
      });
    }

    $("reg-anim").addEventListener("click", function(){
      etat.anim = !etat.anim;
      this.setAttribute("aria-pressed", etat.anim ? "true":"false");
      rendreScene(false);
    });
    var pref = document.querySelector(".champ .prefixe");
    pref.style.display = "none";
    $("saisie").placeholder = "Romains 2 verset 3";

    var minuteur = null;
    function replier(){
      clearTimeout(minuteur);
      minuteur = setTimeout(function(){ construirePages(); rendreScene(false); }, 120);
    }
    window.addEventListener("resize", replier);
    document.addEventListener("fullscreenchange", function(){ setTimeout(replier, 60); });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  function init(){
    demarrer();
    var s = $("saisie");
    if(s) s.focus();
  }
})();
