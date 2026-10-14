/* Apostle — écoute continue et détection d'activité vocale.

   Le micro reste ouvert pendant toute la session. Le son n'en sort pas :
   tout ce qui suit tourne dans le navigateur, sur le poste de régie.

   Trois états :
     écoute   le micro est ouvert, personne ne parle, seul le détecteur tourne
     parole   quelqu'un parle en ce moment
     veille   long silence, les traitements lourds sont suspendus

   C'est ce module qui décide quand la transcription doit démarrer et quand
   elle doit s'arrêter. En production, la même place revient au détecteur de
   mot déclencheur en WebAssembly. */

(function(){

  var contexte = null, flux = null, analyseur = null, tampon = null, minuteur = null;

  var conf = {
    intervalle:   50,     /* ms entre deux mesures */
    seuil:        2.4,    /* combien de fois le bruit de fond pour compter comme parole */
    plancherMin:  0.006,  /* niveau absolu en dessous duquel rien n'est de la parole */
    framesMontee: 2,      /* 100 ms de son avant de déclarer « ça parle » */
    framesDescente: 6,    /* 300 ms de silence avant de déclarer « c'est fini » */
    veilleApres:  90000   /* silence continu avant mise en veille, 0 pour jamais */
  };

  var etat = {
    actif:false, parole:false, veille:false,
    niveau:0, plancher:0.01, historique:[]
  };

  var ecouteurs = {};
  function emettre(nom, valeur){
    (ecouteurs[nom] || []).forEach(function(f){ try{ f(valeur); }catch(e){} });
  }
  function sur(nom, f){
    (ecouteurs[nom] = ecouteurs[nom] || []).push(f);
  }

  var montee = 0, descente = 0, dernierSon = Date.now();

  function mesurer(){
    if(!analyseur) return;
    analyseur.getByteTimeDomainData(tampon);
    var somme = 0;
    for(var i = 0; i < tampon.length; i++){
      var d = (tampon[i] - 128) / 128;
      somme += d * d;
    }
    var rms = Math.sqrt(somme / tampon.length);
    etat.niveau = rms;

    etat.historique.push(rms);
    if(etat.historique.length > 14) etat.historique.shift();

    /* le bruit de fond ne se met à jour que dans le silence */
    if(!etat.parole){
      etat.plancher = etat.plancher * 0.99 + rms * 0.01;
      if(etat.plancher < conf.plancherMin) etat.plancher = conf.plancherMin;
    }

    var actif = rms > etat.plancher * conf.seuil && rms > conf.plancherMin;

    if(actif){
      descente = 0;
      montee++;
      if(!etat.parole && montee >= conf.framesMontee){
        etat.parole = true;
        dernierSon = Date.now();
        if(etat.veille){ etat.veille = false; emettre("reveil"); }
        emettre("debutParole");
      }
      if(etat.parole) dernierSon = Date.now();
    } else {
      montee = 0;
      if(etat.parole){
        descente++;
        if(descente >= conf.framesDescente){
          etat.parole = false;
          descente = 0;
          emettre("finParole");
        }
      } else if(conf.veilleApres && !etat.veille &&
                Date.now() - dernierSon > conf.veilleApres){
        etat.veille = true;
        emettre("veille");
      }
    }

    emettre("niveau", {niveau:rms, plancher:etat.plancher,
                       historique:etat.historique.slice(), parole:etat.parole});
  }

  function demarrer(){
    if(etat.actif) return Promise.resolve(true);
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
      return Promise.reject(new Error("micro_indisponible"));

    return navigator.mediaDevices.getUserMedia({
      audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true }
    }).then(function(f){
      flux = f;
      var AC = window.AudioContext || window.webkitAudioContext;
      contexte = new AC();
      if(contexte.state === "suspended") contexte.resume();
      var source = contexte.createMediaStreamSource(flux);
      analyseur = contexte.createAnalyser();
      analyseur.fftSize = 1024;
      analyseur.smoothingTimeConstant = 0.3;
      source.connect(analyseur);
      tampon = new Uint8Array(analyseur.fftSize);

      etat.actif = true; etat.parole = false; etat.veille = false;
      etat.plancher = 0.01; montee = 0; descente = 0; dernierSon = Date.now();
      minuteur = setInterval(mesurer, conf.intervalle);
      emettre("demarre");
      return true;
    });
  }

  function arreter(){
    clearInterval(minuteur); minuteur = null;
    if(flux) flux.getTracks().forEach(function(p){ p.stop(); });
    if(contexte && contexte.close) { try{ contexte.close(); }catch(e){} }
    flux = null; contexte = null; analyseur = null; tampon = null;
    etat.actif = false; etat.parole = false; etat.veille = false;
    etat.niveau = 0; etat.historique = [];
    emettre("arrete");
  }

  function regler(o){
    for(var k in o) if(conf.hasOwnProperty(k)) conf[k] = o[k];
  }

  window.APOSTLE_ECOUTE = {
    demarrer:demarrer, arreter:arreter, sur:sur, regler:regler,
    etat:etat, conf:conf
  };
})();
