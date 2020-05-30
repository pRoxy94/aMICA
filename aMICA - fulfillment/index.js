'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {Payload, Image} = require('dialogflow-fulfillment');
const admin=require('firebase-admin');
const fbgraph = require('fbgraph');
const _ = require('lodash');
const {dialogflow} = require('actions-on-google');

const medicinale_one = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2FtherapyType%2Fdrug.png?alt=media&token=2faa482a-ed46-4d9f-92d9-6dff823e5216";
const medicinale_two = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2FtherapyType%2Fdrug.png?alt=media&token=2faa482a-ed46-4d9f-92d9-6dff823e5216";
const medicinale_three = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2FtherapyType%2Fdrug.png?alt=media&token=2faa482a-ed46-4d9f-92d9-6dff823e5216";

const reminder = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Fcalendar.png?alt=media&token=6005c521-8a9b-48b4-8afa-508dade12510";
const routine = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Froutine.png?alt=media&token=0023a42d-d134-4547-bb7f-8bb7609ea3a3";

const list = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Fproject%20copia.png?alt=media&token=24cb5624-bbe3-4a51-8ab1-9f39c833a2e0";
const musicaURL = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Fmusic-and-multimedia-2.png?alt=media&token=2fa3bab7-0321-45e2-9497-48fb66304d21";
const cinemaURL = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Fcinema.png?alt=media&token=52ed0fca-e0c0-4c29-a33b-97121ce3e452";

const teatroURL = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Ftheater%20(1).png?alt=media&token=c0c7f627-d0da-4d6a-9bc6-3fb801b2b8f2";

const sportURL = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Ftrophy.png?alt=media&token=ae9c6b14-321a-4791-a65f-da243059902e";
const foodURL = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Fdiet.png?alt=media&token=6c2299ec-cc9e-47e1-91be-b8401a4f2362";
const identityCard = "https://firebasestorage.googleapis.com/v0/b/amico-avkdjm.appspot.com/o/card_icon%2Fstudent.png?alt=media&token=7be8d868-5b64-4f99-bb5b-d5427a430769";


const months = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre'
];

//initialize DB connection
admin.initializeApp({
    credential:admin.credential.applicationDefault(),
    databaseURL:'ws://amico-avkdjm.firebaseio.com/'
});

// enables lib debugging statements
process.env.DEBUG = 'dialogflow:debug';

const app = dialogflow({debug: true});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({ request, response });
    console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body: ' + JSON.stringify(request.body));


    var fbBasePayload =
        {
            "facebook": {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type":"generic",
                        "elements":[

                        ]
                    }
                }
            }
        };

    var emergencyPayload =
        {
            "facebook":
                {
                    "attachment":
                        {
                            "type":"template",
                            "payload":
                                {
                                    "template_type":"button",
                                    "text":"Premi il pulsante qui in basso per chiamare un parente! ☺",
                                    "buttons":[

                                    ]
                                }
                        }
                }
        };

    var musicPayload =
        {
            "messages": [
                {
                    "attachment": {
                        "type": "audio",
                        "payload": {
                            "url": ""
                        }
                    }
                }
            ]
        };

    function fallback(agent) {
        agent.add(`I didn't understand`);
        agent.add(`I'm sorry, can you try again?`);
    }
    

    function sendMusic(musicUrl) {
        let localMusicPayload = musicPayload;
        localMusicPayload.messages[0].attachment.payload.url = musicUrl;
        agent.add(new Payload(agent.FACEBOOK, localMusicPayload, {rawPayload: true, sendAsMessage: true}));
    }

    function handleMusicQuiz(agent) {

        // cambio indice per la scelta del quiz
        musicQuizIndexing();

        
    }

    var musicQuizChoosen;

    function musicQuizIndexing() {
        if (musicQuizChoosen < 3)
            musicQuizChoosen++;
        else {
            musicQuizChoosen = 0;
        }

    }

    /**
     * Messaggio di benvenuto nel caso in cui l'utente contatti il bot per la prima volta.
     * In questo caso verrà salvato il sender id con i relativi counter.
     * Al contatto successivo il bot non si presenterà e, a seconda che l'utente abbia o meno inserito il proprio nome,
     * risponderà con il messaggio appropriato.
     *
     */
    function benvenuto(agent) {
        let senderID = getSenderID();
        console.log('sender id: ' + senderID);

        return admin.database().ref('pazienti/' + senderID).once('value').then((snapshot) => {
            let senderID = snapshot.val();

            if(senderID == null) {
                let pres = '';

                const id = getSenderID();

                const paziente = {
                    counters: {
                        intolleranze: 0,
                        allergie: 0,
                        terapieGiornaliere: 0,
                        terapieIntervallo: 0,
                        musica: 0,
                        cinema:0,
                        teatro:0,
                        sport:0,
                        cibo:0,
                        promemoriaProgrammati: 0,
                        promemoriaRoutine: 0,
                        promemoriaListe: 0,
                        parenti: 0,
                        ricordi: 0,
                        emergenza: 0
                    }
                };

                agent.add(pres);
                let phrase = "Ciao, mi chiamo Amico e sono il tuo assistente virtuale. Sono qui per aiutarti e accompagnarti durante le tue giornate.☺️ Vuoi continuare a parlare con me?";
                let suggestions = [
                    "Sì",
                    "No",
                    "Cancella"
                ];
                setSuggestions(phrase, suggestions, id);

                return admin.database().ref('pazienti/' + id)
                    .set(paziente)
                    .then((snapshot) => {

                    });

            } else {
                let senderID = getSenderID();
                return admin.database().ref('pazienti/' + senderID + '/generalita/nome').once('value').then((snapshot) => {
                    let nome = snapshot.val();
                    console.log('nome: ' + nome);

                    if(nome !== null) {
                        let question = 'Ciao ' + snapshot.val() + ', come posso aiutarti? ☺️';
                        let suggestions = [
                            "Mostra funzionalità",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);

                    } else {
                        let question = 'Ciao, come posso aiutarti? ☺️';
                        let suggestions = [
                           "Mostra funzionalità",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
            }
        });
    }

    //save music pref info
    function handleSaveMusicPrefInfo(agent) {
        const genere = agent.parameters.genere;
        const artista = agent.parameters.artista;
        const canzone = agent.parameters.canzone;

        // Test ok
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle preferenze
        let musicTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/musica');

        return musicTasteCounterPath.once('value').then((snapshot) => {

            // Controllo quanti gusti musicali ha inserito il paziente
            let musicTasteCounterForUser = snapshot.val();
            console.log('Num gusti musicali gia\' espressi: ' + musicTasteCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di preferenze espresse
            let musicTastePath = admin.database().ref('pazienti/' + senderID + '/preferenze/musica/' + musicTasteCounterForUser);

            const musica = {
                genere:genere,
                artista:artista,
                canzone:canzone
            };

            // Salvo il gusto musicale
            musicTastePath.set(musica);

            // Incremento il numero di gusti musicali di una unita'
            let musicTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/musica');
            musicTasteCounterPath.set(musicTasteCounterForUser + 1);
        });
    }

    // retrieve music info
    function handleReadMusicPrefInfo(agent) {

        var canzone = request.body.queryResult.parameters.canzone;
        var genere = request.body.queryResult.parameters.genere;
        var artista = request.body.queryResult.parameters.artista;

        // Test ok
        var senderID = getSenderID();

        console.log('Sender ID: ' + senderID);
        console.log('Vediamo genere: ' + genere);

        // check user request on genere
        if(genere !== "") {
            return admin.database().ref('pazienti/' + senderID + '/preferenze/musica/').once('value').then((snapshot) => {

                let musicPrefJSON = snapshot.val();
                console.log('snapshot if innestati (genere): ' + JSON.stringify(musicPrefJSON));

                if (musicPrefJSON !== null) {
                    var lunghezzaArray = musicPrefJSON.length;
                    console.log('Lunghezza array: ' + lunghezzaArray);

                    // Se si ha un solo gusto musicale parte questa frase
                    if (lunghezzaArray === 1)
                        agent.add('Il tuo genere preferito è la musica ' + _.get(musicPrefJSON, ['0', 'genere']));

                    else {

                        var botResponse = 'I tuoi generi preferiti sono la musica ';
                        var j;

                        // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                        for (j=0; j < lunghezzaArray; j++) {

                            // concateno la congiunzione
                            if (j === lunghezzaArray - 1) {
                                botResponse = botResponse + ' e la musica ';
                            }

                            // concateno il gusto musicale
                            botResponse = botResponse + _.get(musicPrefJSON, [j, 'genere']);

                            // concateno la virgola solo per gli primi n-1 gusti musicali
                            if (j < lunghezzaArray - 2) {
                                    botResponse = botResponse + ', ';
                            }

                            console.log('Gusto musicale in j-esima pos: ' + _.get(musicPrefJSON, [j, 'genere']));
                            console.log('botResponse: ' + botResponse);
                        }
                        agent.add(botResponse);
                    }
                } else {
                    let question = 'Non mi hai detto qual è il tuo genere musicale preferito. Vuoi aggiungerlo?';
                    let suggestions = [
                        "Musica",
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
            });
        }

        // check user request on artista
        if(artista !== "") {
            // Controllo che il genere sia stato inserito
            return admin.database().ref('pazienti/' + senderID + '/preferenze/musica/').once('value').then((snapshot) => {
                let musicPrefJSON = snapshot.val();
                console.log('snapshot if innestati (artista): ' + JSON.stringify(musicPrefJSON));

                if(musicPrefJSON !== null) {
                    var lunghezzaArray = musicPrefJSON.length;
                    console.log('Lunghezza array: ' + lunghezzaArray);

                    // Se si ha un solo gusto musicale parte questa frase
                    if (lunghezzaArray === 1)
                        agent.add('Il tuo artista preferito e\' ' + _.get(musicPrefJSON, ['0', 'artista']));

                    else {
                        var botResponse = 'I tuoi artisti preferiti sono ';
                        var j;

                        // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                        for (j=0; j < lunghezzaArray; j++) {
                            // concateno la congiunzione
                            if (j === lunghezzaArray - 1) {
                                botResponse = botResponse + ' e ';
                            }
                            // concateno il gusto musicale
                            botResponse = botResponse + _.get(musicPrefJSON, [j, 'artista']);
                            // concateno la virgola solo per gli primi n-1 gusti musicali
                            if (j < lunghezzaArray - 2) {
                                botResponse = botResponse + ', ';
                            }

                            console.log('Artista musicale in j-esima pos: ' + _.get(musicPrefJSON, [j, 'artista']));
                            console.log('botResponse: ' + botResponse);
                        }
                        agent.add(botResponse);
                    }
                } else {
                    let question = 'Non mi hai detto qual è il tuo artista preferito. Vuoi aggiungerlo?';
                    let suggestions = [
                        "Musica",
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
            });
        }

        // check user request on canzone
        if(canzone !== "") {
            return admin.database().ref('pazienti/' + senderID + '/preferenze/musica/').once('value').then((snapshot) => {
                let musicPrefJSON = snapshot.val();
                console.log('snapshot if innestati (canzone): ' + JSON.stringify(musicPrefJSON));

                if(musicPrefJSON !== null) {
                    var lunghezzaArray = musicPrefJSON.length;
                    console.log('Lunghezza array: ' + lunghezzaArray);

                    // Se si ha un solo gusto musicale parte questa frase
                    if (lunghezzaArray === 1)
                        agent.add('La tua canzone preferita e\' ' + _.get(musicPrefJSON, ['0', 'canzone']) + ', di ' + _.get(musicPrefJSON, ['0', 'artista']));

                    else {

                        var botResponse = 'I tuoi brani preferiti sono ';
                        var j;

                        // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                        for (j=0; j < lunghezzaArray; j++) {

                            // concateno la congiunzione
                            if (j === lunghezzaArray - 1) {
                                botResponse = botResponse + ' e ';
                            }

                            // concateno il gusto musicale
                            botResponse = botResponse + _.get(musicPrefJSON, [j, 'canzone']);

                            // concateno la virgola solo per gli primi n-1 gusti musicali
                            if (j < lunghezzaArray - 2) {
                                botResponse = botResponse + ', ';
                            }

                            console.log('Artista musicale in j-esima pos: ' + _.get(musicPrefJSON, [j, 'canzone']));
                            console.log('botResponse: ' + botResponse);
                        }
                        agent.add(botResponse);
                    }
                } else {
                    let question = 'Non mi hai parlato della tua canzone preferita! Ti va di aggiungerla?';
                    let suggestions = [
                        "Musica",
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
            });
        }
    }

    // retrieve all music pref info
    function handleReadAllMusicPrefInfo(agent) {
        // Payload base
        var fbLocalBasePayload = fbBasePayload;
        var senderID = getSenderID();

        return admin.database().ref('pazienti/' + senderID + '/preferenze/musica/').once('value').then((snapshot) => {
            let musicPref = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(musicPref));
            console.log('senderID: ' + senderID);
            let i;

            let elements = [];

            let tgTitle = 'Generi:';
            let tgSubtitle = 'Artisti e canzoni:';

            if (musicPref !== null) {
                for (i=0; i < musicPref.length; i++) {
                    if (snapshot.child(i.toString()) !== null) {
                        let genere = snapshot.child(i.toString() + '/genere').val();
                        let artista = snapshot.child(i.toString() + '/artista').val();
                        let canzone = snapshot.child(i.toString() + '/canzone').val();

                        if (senderID.toString().length > 9) {
                            let title = 'Ti piace il ' + genere;
                            let subtitle = 'Artista: ' + artista + '\n' + 'Canzone: ' + canzone;
                            elements[i] = element(title, musicaURL, subtitle);
                            fbLocalBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                        } else {

                            if (i == musicPref.length - 1) {
                                tgTitle += " " + genere;
                                tgSubtitle += " " + artista + " - " + canzone;
                            } else {
                                tgTitle += " " + genere + ",";
                                tgSubtitle += " " + artista + " - " + canzone + ",";
                            }

                        }
                    } else {
                        let question = 'Non mi hai parlato delle tue preferenze musicali! Ti va di aggiungerle?';
                        let suggestions = [
                            "Musica",
                            "Più tardi",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                }

                if (senderID.toString().length > 9) {
                    console.log('Qui entra');
                    agent.add(new Payload('FACEBOOK', fbLocalBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    console.log('tgTitle: ' + tgTitle + '\n' + 'tgSubtitle: ' + tgSubtitle);
                    tgCard(musicaURL, tgTitle, tgSubtitle);
                }
            } else {
                let question = 'Non mi hai parlato delle tue preferenze musicali! Ti va di aggiungerle?';
                let suggestions = [
                    "Musica",
                    "Più tardi",
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

    // save movie pref info
    function handleSaveMoviePrefInfo(agent) {
        const genere = agent.parameters.genere;
        const titolo = agent.parameters.titolo;
        const regista = agent.parameters.regista;

        // Test ok
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle preferenze
        let movieTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/cinema');

        return movieTasteCounterPath.once('value').then((snapshot) => {

            // Controllo quanti gusti cinematografici ha inserito il paziente
            let movieTasteCounterForUser = snapshot.val();
            console.log('Num gusti cinema gia\' espressi: ' + movieTasteCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di preferenze espresse
            let movieTastePath = admin.database().ref('pazienti/' + senderID + '/preferenze/cinema/' + movieTasteCounterForUser);

            const musica = {
                genere:genere,
                titolo:titolo,
                regista:regista
            };

            // Salvo il gusto musicale
            movieTastePath.set(musica);

            // Incremento il numero di gusti cinematografici di una unita'
            let movieTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/cinema');
            movieTasteCounterPath.set(movieTasteCounterForUser + 1);
        });
    }

    // retrieve movie info
    function handleReadMoviePrefInfo(agent) {
        var genere = request.body.queryResult.parameters.genere;
        var titolo = request.body.queryResult.parameters.titolo;
        var regista = request.body.queryResult.parameters.regista;

        // Test ok
        var senderID = getSenderID();

        console.log('Sender ID: ' + senderID);
        console.log('Vediamo genere: ' + genere);

        // check user request on genere
        if(genere !== "") {
            return admin.database().ref('pazienti/' + senderID + '/preferenze/cinema/').once('value').then((snapshot) => {

                    let moviePrefJSON = snapshot.val();
                    console.log('snapshot if innestati (genere): ' + JSON.stringify(moviePrefJSON));

                    if (moviePrefJSON !== null) {
                        // quando non e' array cambiare prima questa riga (1)
                        let lunghezzaArray = Object.keys(moviePrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto cinematografico parte questa frase
                        if (lunghezzaArray === 1)
                            //quando non e' array cambiare anche qui (2)
                            agent.add('Il tuo genere preferito è ' + snapshot.child('0/genere').val());

                        else {

                            let botResponse = 'I tuoi generi preferiti sono ';
                            let j, z;
                            let generi = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let genere = snapshot.child(z.toString() + '/genere').val();
                                generi.add(genere);
                            }

                            generi.delete("undefined");
                            let arrayNoDuplicates = Array.from(generi);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto musicale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti musicali
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }

                                console.log('Gusto cinematografico in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo genere cinematografico preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Cinema",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
            });
        }

        // check user request on titolo
        if(titolo !== "") {
            return admin.database().ref('pazienti/' + senderID + '/preferenze/cinema/').once('value').then((snapshot) => {

                    let moviePrefJSON = snapshot.val();
                    console.log('snapshot if innestati (titolo): ' + JSON.stringify(moviePrefJSON));

                    if(moviePrefJSON !== null) {
                        let lunghezzaArray = Object.keys(moviePrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto musicale parte questa frase
                        if (lunghezzaArray === 1)
                            agent.add('Il tuo film preferito e\' ' + snapshot.child('0/titolo').val());

                        else {

                            let botResponse = 'I tuoi film preferiti sono ';
                            let j, z;

                            let titoli = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let titolo = snapshot.child(z.toString() + '/titolo').val();
                                titoli.add(titolo);
                            }

                            titoli.delete("undefined");
                            let arrayNoDuplicates = Array.from(titoli);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto musicale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti musicali
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }

                                console.log('Titolo film in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo film preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Cinema",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
            });
        }

        // check user request on regista
        if(regista !== "") {
            return admin.database().ref('pazienti/' + senderID + '/preferenze/cinema/').once('value').then((snapshot) => {

                    let moviePrefJSON = snapshot.val();
                    console.log('snapshot if innestati (regista): ' + JSON.stringify(moviePrefJSON));

                    if(moviePrefJSON !== null) {
                        let lunghezzaArray = Object.keys(moviePrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto  parte questa frase
                        if (lunghezzaArray === 1)
                            agent.add('Il tuo regista preferito e\' ' + snapshot.child('0/regista').val() + ', di ' + snapshot.child('0/titolo').val());
                        else {
                            let botResponse = 'I tuoi registi preferiti sono ';
                            let j, z;

                            let registi = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let regista = snapshot.child(z.toString() + '/regista').val();
                                registi.add(regista);
                            }

                            registi.delete("undefined");
                            let arrayNoDuplicates = Array.from(registi);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto cinematografico
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti musicali
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }
                                console.log('Regista in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo regista preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Cinema",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
            });
        }
    }

    // retrieve all movie info
    function handleReadAllMoviePrefInfo(agent) {
        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();

        return admin.database().ref('pazienti/' + senderID + '/preferenze/cinema/').once('value').then((snapshot) => {
            let moviePref = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(moviePref));
            let i;

            let elements = [];

            let tgTitle = 'Generi:';
            let tgSubtitle = 'Registi e titoli:';

            if(moviePref !== null) {
                for (i=0; i < moviePref.length; i++) {
                    let genere = snapshot.child(i.toString() + '/genere').val();
                    let regista = snapshot.child(i.toString() + '/regista').val();
                    let titolo = snapshot.child(i.toString() + '/titolo').val();

                    if (senderID.toString().length > 9) {
                        let title = 'Genere: ' + genere;
                        let subtitle = 'Titolo: ' + titolo + '\n' + 'Regista: ' + regista;
                        elements[i] = element(title, cinemaURL, subtitle);
                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    } else {
                        if (i == moviePref.length - 1) {
                            tgTitle += " " + genere;
                            tgSubtitle += " " + regista + " - " + titolo;
                        } else {
                            tgTitle += " " + genere + ",";
                            tgSubtitle += " " + regista + " - " + titolo + ",";
                        }
                    }
                }
                if (senderID.toString().length > 9) {
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    tgCard(cinemaURL, tgTitle, tgSubtitle);
                }
            } else {
                let question = 'Non mi hai parlato delle tue preferenze cinematografiche! Ti va di aggiungerle?';
                let suggestions = [
                    "Cinema",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

    // save theatre pref info
    function handleSaveTheatrePrefInfo(agent) {
        const genere = agent.parameters.genere;
        const titolo = agent.parameters.titolo;
        const autore = agent.parameters.autore;

        // Test ok
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle preferenze
        let theatreTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/teatro');

        return theatreTasteCounterPath.once('value').then((snapshot) => {

            // Controllo quanti gusti teatrali ha inserito il paziente
            let theatreTasteCounterForUser = snapshot.val();
            console.log('Num gusti teatro gia\' espressi: ' + theatreTasteCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di preferenze espresse
            let theatreTastePath = admin.database().ref('pazienti/' + senderID + '/preferenze/teatro/' + theatreTasteCounterForUser);

            const musica = {
                genere:genere,
                titolo:titolo,
                autore:autore
            };

            // Salvo il gusto teatrale
            theatreTastePath.set(musica);

            // Incremento il numero di gusti teatrali di una unita'
            let theatreTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/teatro');
            theatreTasteCounterPath.set(theatreTasteCounterForUser + 1);
        });
    }

    // retrieve theatre pref info
    function handleReadTheatrePrefInfo(agent) {
        var genere = request.body.queryResult.parameters.genere;
        var titolo = request.body.queryResult.parameters.titolo;
        var autore = request.body.queryResult.parameters.autore;

        var senderID = getSenderID();

        console.log('Sender ID: ' + senderID);
        console.log('Vediamo genere: ' + genere);

        // check user request on genere
        if(genere !== "") {
                return admin.database().ref('pazienti/' + senderID + '/preferenze/teatro/').once('value').then((snapshot) => {

                    let theatrePrefJSON = snapshot.val();
                    console.log('snapshot if innestati (genere): ' + JSON.stringify(theatrePrefJSON));

                    if (theatrePrefJSON !== null) {
                        // quando non e' array cambiare prima questa riga (1)
                        let lunghezzaArray = Object.keys(theatrePrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto teatrale parte questa frase
                        if (lunghezzaArray === 1)
                            //quando non e' array cambiare anche qui (2)
                            agent.add('Il tuo genere preferito è ' + snapshot.child('0/genere').val());

                        else {

                            let botResponse = 'I tuoi generi preferiti sono ';
                            let j, z;
                            let generi = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let genere = snapshot.child(z.toString() + '/genere').val();
                                generi.add(genere);
                            }

                            generi.delete("undefined");
                            let arrayNoDuplicates = Array.from(generi);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto teatrale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti teatrali
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }

                                console.log('Gusto teatrale in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo genere teatrale preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Teatro",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }

        // check user request on titolo
        if(titolo !== "") {
                return admin.database().ref('pazienti/' + senderID + '/preferenze/teatro/').once('value').then((snapshot) => {

                    let theatrePrefJSON = snapshot.val();
                    console.log('snapshot if innestati (titolo): ' + JSON.stringify(theatrePrefJSON));

                    if(theatrePrefJSON !== null) {
                        let lunghezzaArray = Object.keys(theatrePrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto teatrale parte questa frase
                        if (lunghezzaArray === 1)
                            agent.add('La tua opera preferita e\' ' + snapshot.child('0/titolo').val());

                        else {

                            let botResponse = 'Le tue opere preferite sono ';
                            let j, z;

                            let titoli = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let titolo = snapshot.child(z.toString() + '/titolo').val();
                                titoli.add(titolo);
                            }

                            titoli.delete("undefined");
                            let arrayNoDuplicates = Array.from(titoli);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto teatrale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti teatrali
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }

                                console.log('Titolo opera in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è la tua opera preferita. Vuoi aggiungerla?';
                        let suggestions = [
                            "Teatro",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }

        // check user request on autore
        if(autore !== "") {
                return admin.database().ref('pazienti/' + senderID + '/preferenze/teatro/').once('value').then((snapshot) => {

                    let theatrePrefJSON = snapshot.val();
                    console.log('snapshot if innestati (autore): ' + JSON.stringify(theatrePrefJSON));

                    if(theatrePrefJSON !== null) {
                        let lunghezzaArray = Object.keys(theatrePrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto  parte questa frase
                        if (lunghezzaArray === 1)
                            agent.add('Il tuo autore preferito e\' ' + snapshot.child('0/autore').val() + ', di ' + snapshot.child('0/titolo').val());
                        else {
                            let botResponse = 'I tuoi autori preferiti sono ';
                            let j, z;

                            let autori = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let autore = snapshot.child(z.toString() + '/autore').val();
                                autori.add(autore);
                            }

                            autori.delete("undefined");
                            let arrayNoDuplicates = Array.from(autori);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto teatrale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti teatrali
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }
                                console.log('Autore in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo autore preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Teatro",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }
    }

    // retrieve all theatre pref info
    function handleReadAllTheatrePrefInfo(agent) {
        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();

        return admin.database().ref('pazienti/' + senderID + '/preferenze/teatro/').once('value').then((snapshot) => {
            let theatrePref = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(theatrePref));
            let i;

            let elements = [];

            let tgTitle = "Generi:";
            let tgSubtitle = "Titoli e autori:";

            if (theatrePref !== null) {
                for (i=0; i < theatrePref.length; i++) {
                    let genere = snapshot.child(i.toString() + '/genere').val();
                    let titolo = snapshot.child(i.toString() + '/titolo').val();
                    let autore = snapshot.child(i.toString() + '/autore').val();

                    if (senderID.toString().length > 9) {
                        let title = 'Genere: ' + genere;
                        let subtitle = 'Titolo: ' + titolo + '\n' + 'Autore: ' + autore;
                        elements[i] = element(title, teatroURL, subtitle);
                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    } else {

                        if (i == theatrePref.length - 1) {
                            tgTitle += " " + genere;
                            tgSubtitle += " " + titolo + " - " + autore;
                        } else {
                            tgTitle += " " + genere + ",";
                            tgSubtitle += " " + titolo + " - " + autore + ",";
                        }

                    }
                }
                if (senderID.toString().length > 9) {
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    tgCard(teatroURL, tgTitle, tgSubtitle);
                }
            } else {
                let question = 'Non mi hai parlato delle tue preferenze teatrali! Ti va di aggiungerle?';
                let suggestions = [
                    "Teatro",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

    // save sport pref info
    function handleSaveSportPrefInfo(agent) {
        const genere = agent.parameters.genere;
        const personaggio = agent.parameters.personaggio;

        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle preferenze
        let sportTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/sport');

        return sportTasteCounterPath.once('value').then((snapshot) => {

            // Controllo quanti gusti sport ha inserito il paziente
            let sportTasteCounterForUser = snapshot.val();
            console.log('Num gusti sport gia\' espressi: ' + sportTasteCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di preferenze espresse
            let sportTastePath = admin.database().ref('pazienti/' + senderID + '/preferenze/sport/' + sportTasteCounterForUser);

            const sport = {
                genere:genere,
                personaggio:personaggio,
            };

            // Salvo il gusto sportivo
            sportTastePath.set(sport);

            // Incremento il numero di gusti sportivi di una unita'
            let sportTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/sport');
            sportTasteCounterPath.set(sportTasteCounterForUser + 1);
        });
    }

    // read sport pref info
    function handleReadSportPrefInfo(agent) {
        var genere = request.body.queryResult.parameters.genere;
        var personaggio = request.body.queryResult.parameters.personaggio;

        var senderID = getSenderID();

        console.log('Sender ID: ' + senderID);
        console.log('Vediamo genere: ' + genere);

        // check user request on genere
        if(genere !== "") {
                return admin.database().ref('pazienti/' + senderID + '/preferenze/sport/').once('value').then((snapshot) => {

                    let sportPrefJSON = snapshot.val();
                    console.log('snapshot if innestati (genere): ' + JSON.stringify(sportPrefJSON));

                    if(sportPrefJSON !== null) {
                        // quando non e' array cambiare prima questa riga (1)
                        let lunghezzaArray = Object.keys(sportPrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo gusto teatrale parte questa frase
                        if (lunghezzaArray === 1)
                            //quando non e' array cambiare anche qui (2)
                            agent.add('Il tuo genere di sport preferito è ' + snapshot.child('0/genere').val());

                        else {

                            let botResponse = 'I tuoi generi preferiti sono ';
                            let j, z;
                            let generi = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let genere = snapshot.child(z.toString() + '/genere').val();
                                generi.add(genere);
                            }

                            generi.delete("undefined");
                            let arrayNoDuplicates = Array.from(generi);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto teatrale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 gusti sportivi
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }

                                console.log('Gusto sportivo in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo genere sportivo preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Sport",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }

        // check user request on titolo
        if(personaggio !== "") {
                return admin.database().ref('pazienti/' + senderID + '/preferenze/sport/').once('value').then((snapshot) => {

                    let sportPrefJSON = snapshot.val();
                    console.log('snapshot if innestati (personaggio): ' + JSON.stringify(sportPrefJSON));

                    if(sportPrefJSON !== null) {
                        let lunghezzaArray = Object.keys(sportPrefJSON).length;
                        console.log('Lunghezza array: ' + lunghezzaArray);

                        // Se si ha un solo personaggio sportivo parte questa frase
                        if (lunghezzaArray === 1)
                            agent.add('Il tuo personaggio preferito e\' ' + snapshot.child('0/personaggio').val());

                        else {

                            let botResponse = 'I tuoi personaggi preferiti sono ';
                            let j, z;

                            let personaggi = new Set();

                            for (z=0; z < lunghezzaArray; z++) {
                                let personaggio = snapshot.child(z.toString() + '/personaggio').val();
                                personaggi.add(personaggio);
                            }

                            personaggi.delete("undefined");
                            let arrayNoDuplicates = Array.from(personaggi);

                            // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                            for (j=0; j < arrayNoDuplicates.length; j++) {

                                // concateno la congiunzione
                                if (j === arrayNoDuplicates.length - 1) {
                                    botResponse = botResponse + ' e ';
                                }

                                // concateno il gusto teatrale
                                botResponse = botResponse + arrayNoDuplicates[j];

                                // concateno la virgola solo per gli primi n-1 personaggi sportivi
                                if (j < arrayNoDuplicates.length - 2) {
                                    botResponse = botResponse + ', ';
                                }

                                console.log('Personaggio in j-esima pos: ' + arrayNoDuplicates[j]);
                                console.log('botResponse: ' + botResponse);
                            }
                            agent.add(botResponse);
                        }
                    } else {

                        let question = 'Non mi hai detto qual è il tuo personaggio sportivo preferito. Vuoi aggiungerlo?';
                        let suggestions = [
                            "Sport",
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }
    }

    // retrieve all sport pref info
    function handleReadAllSportPrefInfo(agent) {
        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();

        return admin.database().ref('pazienti/' + senderID + '/preferenze/sport/').once('value').then((snapshot) => {
            let sportPref = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(sportPref));
            let i;

            let elements = [];
            let tgTitle = 'Sport:';
            let tgSubtitle = 'Personaggio:';

            if(sportPref !== null) {
                for (i=0; i < sportPref.length; i++) {
                    let genere = snapshot.child(i.toString() + '/genere').val();
                    let personaggio = snapshot.child(i.toString() + '/personaggio').val();

                    if (senderID.toString().length > 9) {
                        let title = 'Sport: ' + genere;
                        let subtitle = 'Personaggio: ' + personaggio;
                        elements[i] = element(title, sportURL, subtitle);
                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    } else {
                        if (i == sportPref.length - 1) {
                            tgTitle += " " + genere;
                            tgSubtitle += " " + personaggio;
                        } else {
                            tgTitle += " " + genere + ",";
                            tgSubtitle += " " + personaggio;
                        }
                    }
                }
                if (senderID.toString().length > 9) {
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    tgCard(sportURL, tgTitle, tgSubtitle);
                }
            } else {
                let question = 'Non mi hai parlato delle tue preferenze sportive. Vuoi aggiungerlo?';
                let suggestions = [
                    "Sport",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

    // save food pref info
    function handleSaveFoodPrefInfo(agent) {
        const tipologia = agent.parameters.tipologia;

        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle preferenze
        let foodTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/cibo');

        return foodTasteCounterPath.once('value').then((snapshot) => {

            // Controllo quanti gusti sport ha inserito il paziente
            let foodTasteCounterForUser = snapshot.val();
            console.log('Num gusti cibo gia\' espressi: ' + foodTasteCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di preferenze espresse
            let foodTastePath = admin.database().ref('pazienti/' + senderID + '/preferenze/cibo/' + foodTasteCounterForUser);

            const food = {
                tipologia:tipologia
            };

            // Salvo il gusto sportivo
            foodTastePath.set(food);

            // Incremento il numero di gusti alimentari di una unita'
            let foodTasteCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/cibo');
            foodTasteCounterPath.set(foodTasteCounterForUser + 1);
        });
    }

    // read food pref info
    function handleReadFoodPrefInfo(agent) {
        var tipologia = request.body.queryResult.parameters.tipologia;

        var senderID = getSenderID();

        console.log('Sender ID: ' + senderID);
        console.log('Vediamo tipologia: ' + tipologia);

        // check user request on tipologia
        if(tipologia !== "") {
            return admin.database().ref('pazienti/' + senderID + '/preferenze/cibo/').once('value').then((snapshot) => {

                let foodPrefJSON = snapshot.val();
                console.log('snapshot if innestati (tipologia): ' + JSON.stringify(foodPrefJSON));

                if (foodPrefJSON !== null) {
                    // quando non e' array cambiare prima questa riga (1)
                    let lunghezzaArray = Object.keys(foodPrefJSON).length;
                    console.log('Lunghezza array: ' + lunghezzaArray);

                    // Se si ha un solo gusto alimentare parte questa frase
                    if (lunghezzaArray === 1)
                        //quando non e' array cambiare anche qui (2)
                        agent.add('Il tuo cibo preferito è ' + snapshot.child('0/tipologia').val());

                    else {

                        let botResponse = 'I tuoi cibi preferiti sono ';
                        let j, z;
                        let tipologie = new Set();

                        for (z = 0; z < lunghezzaArray; z++) {
                            let tipologia = snapshot.child(z.toString() + '/tipologia').val();
                            tipologie.add(tipologia);
                        }

                        tipologie.delete("undefined");
                        let arrayNoDuplicates = Array.from(tipologie);

                        // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                        for (j = 0; j < arrayNoDuplicates.length; j++) {

                            // concateno la congiunzione
                            if (j === arrayNoDuplicates.length - 1) {
                                botResponse = botResponse + ' e ';
                            }

                            // concateno il gusto teatrale
                            botResponse = botResponse + arrayNoDuplicates[j];

                            // concateno la virgola solo per gli primi n-1 gusti sportivi
                            if (j < arrayNoDuplicates.length - 2) {
                                botResponse = botResponse + ', ';
                            }

                            console.log('Gusto alimentare in j-esima pos: ' + arrayNoDuplicates[j]);
                            console.log('botResponse: ' + botResponse);
                        }
                        agent.add(botResponse);
                    }
                } else {
                    let question = 'Non mi hai detto qual è il tuo cibo preferito. Vuoi aggiungerlo?';
                    let suggestions = [
                        "Cibo",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
            });
        }
    }

    // read all food pref info
    function handleReadAllFoodPrefInfo(agent) {
        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();

        return admin.database().ref('pazienti/' + senderID + '/preferenze/cibo/').once('value').then((snapshot) => {
            let foodPref = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(foodPref));
            let i;

            let elements = [];

            let tgTitle = "Il tuo piatto preferito è:";

            if(foodPref !== null) {
                for (i=0; i < foodPref.length; i++) {
                    let tipologia = snapshot.child(i.toString() + '/tipologia').val();

                    let title = 'Il tuo piatto preferito è: ' + '\n' + tipologia;
                    if (senderID.toString().length > 9) {
                        elements[i] = element(title, foodURL);
                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    } else {
                        tgCard(foodURL, title, ' ');
                    }

                }
                agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
            } else {
                let question = 'Non mi hai parlato delle tue preferenze alimentari! Ti va di aggiungerle?';
                let suggestions = [
                    "Cibo",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

     //save daily therapy info
     function handleSaveDailyTherapyInfo(agent) {
         const descrizione = agent.parameters.descrizione;
         const farmaco = agent.parameters.farmaco;
         const orario = agent.parameters.orario;

         // Test ok
         const senderID = getSenderID();

         // Ottengo la posizione dei contatori delle terapie giornaliere
         let dailyTherapyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/terapieGiornaliere');
         return dailyTherapyCounterPath.once('value').then((snapshot) => {
             // Controllo quante terapie giornaliere ha inserito il paziente
             let dailyTherapyCounterForUser = snapshot.val();
             console.log('terapie giornaliere gia\' espresse: ' + dailyTherapyCounterForUser);

             // Test sender id
             console.log('SenderID: ' + senderID);

             // Creo path con id pari a quantita' di terapie giornaliere espresse
             let therapyPath = admin.database().ref('pazienti/' + senderID + '/terapie/giornaliera/' + dailyTherapyCounterForUser);

             const terapia = {
                 descrizione:descrizione,
                 farmaco:farmaco,
                 orario:orario
             };

             therapyPath.set(terapia);

             // Incremento il numero di terapie giornaliere di una unita'
             let dailyTherapyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/terapieGiornaliere');
             dailyTherapyCounterPath.set(dailyTherapyCounterForUser + 1);
         });
     }

    //read daily therapy info
    function handleReadDailyTherapiesInfo() {
        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        var medicinaliURL = [medicinale_one, medicinale_two, medicinale_three];

        return admin.database().ref('pazienti/' + senderID + '/terapie/giornaliera/').once('value').then((snapshot) => {
            let therapies = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(therapies));
            let i;

            let elements = [];
            let tgTitle = 'Descrizione:';
            let tgSubtitle = 'Farmaco e assunzione:';

            if(therapies !== null) {
                for (i=0; i < therapies.length; i++) {
                    let thDescription = snapshot.child(i.toString() + '/descrizione').val();
                    let thDrug = snapshot.child(i.toString() + '/farmaco').val();

                    let time = snapshot.child(i.toString() + '/orario/').val();
                    console.log("Time: " + JSON.stringify(time));

                    let timeValues = {};
                    let title = "Ore: ";
                    if (!Array.isArray(time)) {
                        timeValues[0] = time[0].slice(11, 13);
                        title = title.concat(timeValues[0]) + ", " + "\n";
                    } else {
                        let j;
                        timeValues = Object.values(time);
                        for (j=0; j < timeValues.length; j++) {
                            timeValues[j] = timeValues[j].slice(11, 13);
                            title = title.concat(timeValues[j] + ", " + "\n");
                            console.log("Time array: " + timeValues[j].toString());
                        }
                    }

                        if (senderID.toString().length > 9) {
                            title = title.concat('Farmaco: ' + thDrug);
                            let subtitle = 'Terapia per ' + thDescription + '\n';
                            elements[i] = element(title, medicinaliURL[i], subtitle);

                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    } else {
                        if (i == therapies.length - 1) {
                            tgTitle += " " + thDescription;
                            tgSubtitle += " " + thDrug + " - " + time;
                        } else {
                            tgTitle += " " + thDescription + ",";
                            tgSubtitle += " " + thDrug + " - " + time + "\n";
                        }
                    }
                }
                if (senderID.toString().length > 9) {
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    tgCard(medicinale_one, tgTitle, tgSubtitle);
                }
            } else {
                let question = 'Non mi hai parlato delle tue terapie. Vuoi aggiungerle?';
                let suggestions = [
                    "Terapie",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

    // save interval therapy info
    function handleSaveIntervalTherapyInfo(agent) {
        const descrizione = agent.parameters.descrizione;
        const farmaco = agent.parameters.farmaco;
        const giorni = agent.parameters.giorni;
        const orario = agent.parameters.orario;

        // Test ok
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle terapie intervallari
        let intervalTerapyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/terapieIntervallo');

        return intervalTerapyCounterPath.once('value').then((snapshot) => {
            // Controllo quante terapie intervallari ha inserito il paziente
            let intervalTerapyCounterForUser = snapshot.val();
            console.log('terapie intervallari gia\' espresse: ' + intervalTerapyCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di terapie intervallari espresse
            let terapyPath = admin.database().ref('pazienti/' + senderID + '/terapie/intervallare/' + intervalTerapyCounterForUser);

            const terapia = {
                descrizione:descrizione,
                farmaco:farmaco,
                giorni:giorni,
                orario:orario
            };

            terapyPath.set(terapia);

            // Incremento il numero di terapie intervallari di una unita'
            let intervalTerapyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/terapieIntervallo');
            intervalTerapyCounterPath.set(intervalTerapyCounterForUser + 1);
        });
    }

    //read interval therapy info
    function handleReadIntervalTherapiesInfo() {

        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        var medicinaliURL = [medicinale_one, medicinale_two, medicinale_three];
         return admin.database().ref('pazienti/' + senderID + '/terapie/intervallare/').once('value').then((snapshot) => {

                let therapies = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(therapies));

             let tgTitle = 'Descrizione:';
             let tgSubtitle = 'Farmaco e assunzione:';

                if(therapies !== null) {
                    let i;
                    let elements = [];
                    for (i=0; i < therapies.length; i++) {
                        let j;
                        let thDescription = snapshot.child(i.toString() + '/descrizione').val();
                        let thDrug = snapshot.child(i.toString() + '/farmaco').val();
                        let thDays = function () {
                            let days = snapshot.child(i.toString() + '/giorni/').val();
                            return days;
                        };
                        let thTime = snapshot.child(i.toString() + '/orario').val().slice(11, 13);

                        if (senderID.toString().length > 9) {
                            let title = thDays() + ' ore ' + thTime + ': ' + thDrug;
                            let subtitle = 'Terapia per ' + thDescription;
                            elements[i] = element(title, medicinaliURL[i], subtitle);

                            localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                        } else {
                            if (i == therapies.length - 1) {
                                tgTitle += " " + thDescription;
                                tgSubtitle += " " + thDrug + " - " + thDays() + " alle ore " + thTime;
                            } else {
                                tgTitle += " " + thDescription + ",";
                                tgSubtitle += " " + thDrug + " - " + thDays() + + " alle ore " + thTime +  "\n";
                            }
                        }
                    }

                    if (senderID.toString().length > 9) {
                        agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                    } else {
                        tgCard(medicinale_two, tgTitle, tgSubtitle);
                    }

                } else {
                    let question = 'Non mi hai parlato delle tue terapie. Vuoi aggiungerle?';
                    let suggestions = [
                        "Terapie",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
         });
    }

    // save user memories info
    function handleSaveMemoriesInfo(agent) {
        const descrizione = agent.parameters.descrizione;
        const indTemporale = agent.parameters.indTemporale;

        const senderID = getSenderID();

        // Ottengo la posizione dei contatori dei ricordi
        let memoriesCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/ricordi');

        return memoriesCounterPath.once('value').then((snapshot) => {
            // Controllo quanti ricordi ha inserito il paziente
            let memoriesCounterForUser = snapshot.val();
            console.log('ricordi gia\' espressi: ' + memoriesCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di ricordi espressi
            let memoriesPath = admin.database().ref('pazienti/' + senderID + '/ricordi/' + memoriesCounterForUser);

            const ricordo = {
                descrizione:descrizione,
                indTemporale:indTemporale,
            };

            memoriesPath.set(ricordo);

            // Incremento il numero di parenti di una unita'
            let memoriesCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/ricordi');
            memoriesCounterPath.set(memoriesCounterForUser + 1);
        });
    }

    // save memories photo
    function handleSaveMemoriesPhoto() {
        let senderID = getSenderID();

        var photoUrl = request.body.originalDetectIntentRequest.payload.data.message.attachments[0].payload.url;
        var memoriesPath = admin.database().ref('pazienti/' + senderID + '/ricordi');

        console.log(photoUrl);

        return memoriesPath.once('value').then((function (snapshot) {

            let index = Object.keys(snapshot.val()).length - 1;

            // console.log('relativeCounter (index of last added relative): ' + index);
            // console.log('snapshot: ' + JSON.stringify(snapshot));

            let lastMemoriesAddedPath = memoriesPath.child(index);
            lastMemoriesAddedPath.update({
                foto: photoUrl
            }, function (error) {
                if (error) {
                    console.log('Qualcosa e\' andato storto...');
                } else {
                    console.log('Foto aggiornata!');
                }
            });
        }));
    }

    // read memories info
    function handleReadMemoriesInfo(agent) {

        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        return admin.database().ref('pazienti/' + senderID + '/ricordi/').once('value').then((snapshot) => {

                let memories = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(memories));

                if (memories !== null) {
                    let i;
                    let elements = [];

                    for (i=0; i < memories.length; i++) {
                        let memDescription = snapshot.child(i.toString() + '/descrizione').val();
                        let memPhoto = snapshot.child(i.toString() + '/foto').val();
                        let memTime = function () {
                            let extractedDate = snapshot.child(i.toString() + '/indTemporale').val();
                            var longDate;

                            // TODO remove code
                            console.log('extractedDate: ' + JSON.stringify(extractedDate) + '\n' +
                                'typeof extractedDate: ' + (typeof extractedDate));

                            // Controllo metodo salvataggio data
                            // e.g.: se utente inserisce 'anno scorso', sys.location
                            // effettuerà il salvataggio di due oggetti all'interno
                            // di indTemporale: startDate e endDate, indicanti
                            // le estremità temporali coincidenti con l'espressione
                            // 'anno scorso', ovvero 01-01-anno e 31-12-anno

                            if (Object.keys(extractedDate).length > 1 && typeof extractedDate === 'object') {
                                let finalDate = extractedDate.endDate.slice(0, 4);
                                return finalDate;
                            } else {
                                if (typeof extractedDate === 'string') {
                                    let memMonth = extractedDate.slice(5, 7);
                                    let memYear = extractedDate.slice(0, 4);
                                    if (memMonth.substring(0, 1) == '0') {
                                        memMonth = memMonth.slice(1, 2);
                                    }
                                    console.log('longDate: ' + extractedDate);
                                    return months[memMonth - 1] + ' del ' + memYear;
                                } else {
                                    longDate = extractedDate.date_time;
                                    let memMonth = longDate.slice(5, 7);
                                    let memYear = longDate.slice(0, 4);
                                    if (memMonth.substring(0, 1) == '0') {
                                        memMonth = memMonth.slice(1, 2);
                                    }
                                    console.log('longDate: ' + longDate);
                                    return months[memMonth - 1] + ' del ' + memYear;
                                }
                            }
                        };

                        let title = memDescription;
                        let memoryTime = memTime();
                        let subtitle;
                        if (memoryTime.length <= 4)
                            subtitle = 'Evento del ' + memoryTime;
                        else subtitle = 'Evento di ' + memoryTime;
                        elements[i] = element(title, memPhoto, subtitle);

                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    }
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    let question = 'Non mi hai parlato dei tuoi ricordi. Vuoi aggiungerli?';
                    let suggestions = [
                        "Ricordi",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    // save user relatives info
    function handleSaveRelativesInfo(agent) {
        const parentela = agent.parameters.parentela;
        const nome = agent.parameters.nome;
        const eta = agent.parameters.eta;
        const dataNascita = agent.parameters.dataNascita;

        // Test ok
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori dei parenti
        let relativesCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/parenti');

        return relativesCounterPath.once('value').then((snapshot) => {
            // Controllo quanti parenti ha inserito il paziente
            let relativesCounterForUser = snapshot.val();
            console.log('parenti gia\' espressi: ' + relativesCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di parenti espressi
            let relativesPath = admin.database().ref('pazienti/' + senderID + '/parenti/' + relativesCounterForUser);

            const parente = {
                parentela:parentela,
                nome:nome,
                eta:eta,
                dataNascita:dataNascita,
            };

            relativesPath.set(parente);

            // Incremento il numero di parenti di una unita'
            let relativesCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/parenti');
            relativesCounterPath.set(relativesCounterForUser + 1);
        });
    }

    // save relatives photo
    function handleSaveRelativesPhoto() {

        let senderID = getSenderID();

        var photoUrl = request.body.originalDetectIntentRequest.payload.data.message.attachments[0].payload.url;
        var relativesPath = admin.database().ref('pazienti/' + senderID + '/parenti');

        console.log(photoUrl);

        return relativesPath.once('value').then((function (snapshot) {

            let array = snapshot.val();
            console.log('path Firebase: ' + snapshot.val());
            let lastRelativeAddedPath = relativesPath.child(array.length - 1);
            lastRelativeAddedPath.update({
                foto: photoUrl
            }, function (error) {
                if (error) {
                    console.log('Qualcosa e\' andato storto...');
                } else {
                    console.log('Foto aggiornata!');
                }
            });
        }));
    }

    // read relatives info
    function handleReadRelativesInfo(agent) {

        // Parenti
        var marito = request.body.queryResult.parameters.marito;
        var moglie = request.body.queryResult.parameters.moglie;
        var padre = request.body.queryResult.parameters.padre;
        var madre = request.body.queryResult.parameters.madre;
        var fratello = request.body.queryResult.parameters.fratello;
        var sorella = request.body.queryResult.parameters.sorella;
        var cugino = request.body.queryResult.parameters.cugino;
        var cugina = request.body.queryResult.parameters.cugina;
        var genero = request.body.queryResult.parameters.genero;
        var nuora = request.body.queryResult.parameters.nuora;
        var nipote = request.body.queryResult.parameters.nipote;

        var sender = getSenderID();

        // Test necessario per appaiamento dialogflow
        console.log('Parametro acquisito da Dialogflow:\nMarito: ' + marito + '\nMoglie: ' + moglie + '\nPadre: ' + padre + '\nMadre: ' + madre + '\nFratello: ' + fratello);
        console.log('Parametro acquisito da Dialogflow:\nSorella: ' + sorella + '\nCugino: ' + cugino + '\nCugina: ' + cugina + '\nGenero: ' + genero + '\nNuora: ' + nuora + '\nNipote: ' + nipote);


        var affinities = [marito, moglie, padre, madre, fratello, sorella, cugino, cugina, genero, nuora, nipote];

        console.log('array affinities: ' + affinities);
        var affinity = affinities.join('').toString();

        console.log('Parentela: ' + affinity);
        return admin.database().ref('pazienti/' + sender + '/parenti/').once('value').then((snapshot) => {

                let names = [];
                let affinities = [];
                let ages = [];
                let birthdates = [];
                let photosURL = [];

                let relatives = snapshot.val();
                console.log('snapshot : ' + JSON.stringify(relatives));

                if(relatives !== null) {
                    // Contatore per il ciclo
                    var relativesCounter;

                    // Numero effettivo di parenti memorizzati
                    var relativesQty = relatives.length;
                    console.log('Numero parenti salvati: ' + relativesQty);

                    // Ciclo fra i parenti per cercare il parente del grado 'affinity'
                    for (relativesCounter = 0; relativesCounter < relativesQty; relativesCounter++) {

                        console.log('A cosa punta lo snapshot?: ' + relatives[relativesCounter].parentela);

                        if (relatives[relativesCounter].parentela != affinity) {
                            console.log('Il ' + relativesCounter + 'o ciclo non ha restituito ' + affinity);
                        } else {
                            // Dati parente
                            var relativeName = relatives[relativesCounter].nome;
                            var relativeAffinity = relatives[relativesCounter].parentela;
                            var relativeAge = relatives[relativesCounter].eta;
                            var relativeBirthdate = relatives[relativesCounter].dataNascita;
                            var relativePhotoURL = relatives[relativesCounter].foto;


                            console.log('Dati acquisiti:\n' + 'Nome parente: ' + relativeName + '\n' + 'Grado parente: ' + relativeAffinity + '\n' + 'Eta parente: ' + relativeAge + '\n' + 'Foto parente (url): ' + relativePhotoURL);

                            names.push(relativeName);
                            affinities.push(relativeAffinity);
                            ages.push(relativeAge);
                            birthdates.push(relativeBirthdate);
                            photosURL.push(relativePhotoURL);

                        }
                    }

                    if (names.length === 1) {
                        let date = getDate(birthdates[0]);
                        let text = 'Si chiama ' + names[0] + ', ha ' + ages[0] + ' anni ed il suo compleanno è il ' + date;
                        agent.add(text);

                        //Foto
                        if (relativePhotoURL != undefined) {
                            agent.add('Ecco una sua foto');
                            agent.add(new Image(photosURL[0]));
                        }

                    } else if (names.length === 0) {
                        agent.add('Non mi hai parlato di un ' + affinity);
                    } else {
                        var text = 'Si chiamano ';
                        names.forEach((item) => {
                            text += item + ', ';
                        });
                        text += 'il loro compleanno è rispettivamente il ';
                        birthdates.forEach((item) => {
                            text += getDate(item) + ', ';
                        });
                        text += 'e hanno ';
                        ages.forEach((item) => {
                            text += item + ', ';
                        });
                        text += 'anni';

                        // Descrizione parente
                        agent.add(text);

                        //Foto
                        let photos = [];
                        if (relativePhotoURL != undefined) {
                            photosURL.forEach((item) => {
                                photos.push(new Image(item));
                            });
                            agent.add('Ecco le loro foto: ');
                            agent.add(photos);
                        }
                    }
                } else {
                    let question = 'Non mi hai parlato dei tuoi parenti. Vuoi aggiungerli?';
                    let suggestions = [
                        "Parenti",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    // read all relatives info
    function handleReadAllRelativesInfo() {

        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        return admin.database().ref('pazienti/' + senderID + '/parenti/').once('value').then((snapshot) => {

            let relatives = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(relatives));

            if(relatives !== null) {
                let i;
                let elements = [];

                for (i=0; i < relatives.length; i++) {
                    let relName = snapshot.child(i.toString() + '/nome').val();
                    let relAffinity = snapshot.child(i.toString() + '/parentela').val();
                    let relAge = snapshot.child(i.toString() + '/eta').val();
                    let relPhotoURL = snapshot.child(i.toString() + '/foto').val();
                    let tempBirtdate = snapshot.child(i.toString() + '/dataNascita').val();
                    let relBirthDate = getDate(tempBirtdate);

                    console.log(
                        'relName: ' + relName + '\n' +
                        'relAffinity: ' + relAffinity + '\n' +
                        'relAge: ' + relAge + '\n' +
                        'relPhotoURL: ' + relPhotoURL + '\n' +
                        'relBirthDate: ' + relBirthDate + '\n');

                    let title = relName + ', ' + relAge + ' anni e ti è ' + relAffinity;
                    let subtitle = 'E\' nato il ' + relBirthDate;
                    elements[i] = element(title, relPhotoURL, subtitle);

                    localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                }
                //agent.add('Ecco a lei la sua terapia giornaliera:');
                agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
            } else {
                let question = 'Non mi hai parlato dei tuoi parenti. Vuoi aggiungerli?';
                let suggestions = [
                    "Parenti",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });
    }

    function getDate(longDate) {
        let day = longDate.slice(8, 10);
        let month = longDate.slice(5, 7);
        let year = longDate.slice(0, 4);
        if (month.substring(0, 1) == '0') {
            month = month.slice(1, 2);
        }
        return day + ' ' + months[month - 1] + ' del ' + year;
    }

    // save programmed reminder info
    function handleSaveProgReminderInfo() {
        const desc = agent.parameters.descrizione;
        const data = agent.parameters.data;
        const ora = agent.parameters.ora;

        // Test
        const senderID = getSenderID();

        if(request.body.originalDetectIntentRequest.source === "google") {
            app.intent('askProgReminder', (conv) => {
                conv.ask("test");
            });
        } else {
            // Ottengo la posizione dei contatori dei promemoria programmati
            let progReminderCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaProgrammati');

            return progReminderCounterPath.once('value').then((snapshot) => {
                // Controllo quanti prom programmati ha inserito il paziente
                let progReminderCounterForUser = snapshot.val();
                console.log('promemoria programmati gia\' espressi: ' + progReminderCounterForUser);

                // Test sender id
                console.log('SenderID: ' + senderID);

                // Creo path con id pari a quantita' di prom programmati espressi
                let progReminderPath = admin.database().ref('pazienti/' + senderID + '/promemoria/programmato/' + progReminderCounterForUser);

                const promemoria = {
                    descrizione:desc,
                    data:data,
                    ora:ora
                };

                progReminderPath.set(promemoria);

                // Incremento il numero di prom programmati di una unita'
                let progReminderCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaProgrammati');
                progReminderCounterPath.set(progReminderCounterForUser + 1);
            });
        }
    }

    // read programmed reminder info
    function  handleReadProgReminderInfo() {

        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        var reminderURL = reminder;
        return admin.database().ref('pazienti/' + senderID + '/promemoria/programmato/').once('value').then((snapshot) => {

                let reminders = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(reminders));

                if(reminders !== null) {
                    let i;
                    let elements = [];

                    for (i=0; i < reminders.length; i++) {
                        let thDescription = snapshot.child(i.toString() + '/descrizione').val();
                        //let thStreet = snapshot.child(i.toString() + '/luogo/street-address').val();
                        //let thCity = snapshot.child(i.toString() + '/luogo/city').val();

                        let thTime = function () {
                            let time = snapshot.child(i.toString() + '/ora').val();
                            return time.slice(11, 13);
                        };

                        let thDate = snapshot.child(i.toString() + '/data').val();
                        let partialDate = getDate(thDate);

                        let title = 'Giorno ' + partialDate + ': ' + thDescription;
                        let subtitle = 'Alle ore ' + thTime();
                        let buttonText = 'Elimina';
                        let buttonPostback = 'Elimina promemoria ' + thDescription;
                        elements[i] = elementWithButton(title, reminderURL, subtitle, buttonText, buttonPostback);

                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    }
                    //agent.add('Ecco a lei la sua terapia giornaliera:');
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    let question = 'Non mi hai parlato dei tuoi promemoria programmati. Vuoi aggiungerli?';
                    let suggestions = [
                        "Programma",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    function handleDeleteProgReminderInfo() {

        let senderID = getSenderID();
        var progPath = admin.database().ref('pazienti/' + senderID + '/promemoria/programmato/');
        var descrizione = agent.parameters.descrizione;

        return progPath.once('value').then((function (snapshot) {

            // Ottengo indice promemoria selezionato dall'utente
            var i;
            var indexSelectedProg;
            let actualProgName;
            for (i=0; i < snapshot.val().length; i++) {
                actualProgName = snapshot.child(i.toString() + '/titolo').val();
                if (descrizione == actualProgName) {
                    indexSelectedProg = i;
                }
            }

            // Salvo tutto il JSON dei promemoria programmati
            let allProgJSON = snapshot.val();

            // Rimuovo il promemoria selezionato dall'elenco e costruisco un nuovo JSON
            allProgJSON.splice(parseInt(indexSelectedProg), 1);

            // Effettuo un update al livello di 'liste'
            progPath.set(allProgJSON,
                function (error) {
                    if (error) {
                        console.log('Qualcosa e\' andato storto...');
                    } else {
                        console.log('Prom programmato eliminato!');
                    }
                });

            // Decremento il contatore del numero dei promemoria
            var progCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaProgrammati/');
            return progCounterPath.once('value').then((snapshot) => {
                let numProgrammati = snapshot.val();
                console.log('numListe: ' + numProgrammati);
                progCounterPath.set(numProgrammati - 1);
                agent.add('Promemoria eliminato!');
            });

        }));

    }

    // save routine reminder info
    function handleSaveRoutineReminderInfo() {
        const desc = agent.parameters.descrizione;
        const ripetizione = agent.parameters.ripetizione;
        const giorni = agent.parameters.giorni;
        const orario = agent.parameters.orario;

        // Test
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori dei promemoria routine
        let progRoutineCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaRoutine');

        return progRoutineCounterPath.once('value').then((snapshot) => {

            // Controllo quanti prom di routine ha inserito il paziente
            let progRoutineCounterForUser = snapshot.val();
            console.log('promemoria di routine gia\' espressi: ' + progRoutineCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di prom routine espressi
            let progRoutinePath = admin.database().ref('pazienti/' + senderID + '/promemoria/routine/' + progRoutineCounterForUser);

            const promemoria = {
                descrizione:desc,
                ripetizione: ripetizione,
                giorni:giorni,
                orario:orario
            };

            progRoutinePath.set(promemoria);

            // Incremento il numero di prom di routine di una unita'
            let progRoutineCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaRoutine');
            progRoutineCounterPath.set(progRoutineCounterForUser + 1);
        });
    }

    // read programmed reminder info
    function handleReadRoutineReminderInfo() {

        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        var reminderURL = routine;
        return admin.database().ref('pazienti/' + senderID + '/promemoria/routine/').once('value').then((snapshot) => {

                let reminders = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(reminders));

                if(reminders !== null) {
                    let i;
                    let elements = [];

                    for (i=0; i < reminders.length; i++) {
                        let thDescription = snapshot.child(i.toString() + '/descrizione').val();
                        let thRipetizione = snapshot.child(i.toString() + '/ripetizione').val();

                        let thTime = function () {
                            let time = snapshot.child(i.toString() + '/orario').val();
                            return time.slice(11, 13);
                        };

                        let giorni = snapshot.child(i.toString() + '/giorni').val();

                        let title = thDescription + ': ' + thRipetizione + ' volte a settimana';
                        let subtitle = 'Giorni: ' + giorni + '\n' + 'Alle ore ' + thTime();
                        elements[i] = element(title, reminderURL, subtitle);

                        localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                    }
                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));

                } else {
                    let question = 'Non mi hai parlato delle tue routine. Vuoi aggiungerle?';
                    let suggestions = [
                        "Routine",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    // save lists reminder info
    function handleSaveListsReminderInfo() {
        var titolo = agent.parameters.titolo;
        var elementi = agent.parameters.elementi;

        // Test
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori dei promemoria lista
        let progListCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaListe');

        return progListCounterPath.once('value').then((snapshot) => {
            // Controllo quanti prom di lista ha inserito il paziente
            let progListCounterForUser = snapshot.val();
            console.log('promemoria di liste gia\' espressi: ' + progListCounterForUser);

            // Test sender id
            console.log('SenderID: ' + senderID);

            // Creo path con id pari a quantita' di prom routine espressi
            let progListPath = admin.database().ref('pazienti/' + senderID + '/promemoria/liste/' + progListCounterForUser);

            const promemoria = {
                titolo:titolo,
                elementi: elementi
            };

            progListPath.set(promemoria);

            // Incremento il numero di prom di lista di una unita'
            let progListCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaListe');
            progListCounterPath.set(progListCounterForUser + 1);
        });
    }

    function handleAddMoreElementsListsReminder(agent) {

        let senderID = getSenderID();
        var listsPath = admin.database().ref('pazienti/' + senderID + '/promemoria/liste/');
        var elementi = agent.parameters.elementi;

        return listsPath.once('value').then((function (snapshot) {

            let index = Object.keys(snapshot.val()).length - 1;
            console.log('Indice: ' + index);
            // console.log('relativeCounter (index of last added relative): ' + index);
            // console.log('snapshot: ' + JSON.stringify(snapshot));
            let lastListAddedPath = listsPath.child(index);

            return lastListAddedPath.once('value').then((snapshot) => {

                let oldElementi = snapshot.child('elementi').val();
                console.log('Lista elementi attuali: ' + elementi);
                console.log('Lista elementi vecchi: ' + oldElementi);
                let mergedList = oldElementi + ', ' + elementi;

                lastListAddedPath.update({
                    elementi: mergedList
                }, function (error) {
                    if (error) {
                        console.log('Qualcosa e\' andato storto...');
                    } else {
                        console.log('Lista aggiornata!');
                    }
                    agent.add('Abbiamo aggiunto ' + elementi + ' alla tua lista!');
                });
            });

        }));

    }

    // read lists reminder info
    function handleReadListsReminderInfo() {
        // Payload base
        var localBasePayload = fbBasePayload;
        var senderID = getSenderID();
        var reminderURL = list;

        return admin.database().ref('pazienti/' + senderID + '/promemoria/liste/').once('value').then((snapshot) => {

                let reminders = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(reminders));

                if(reminders !== null) {
                    let i;
                    let elements = [];

                    for (i=0; i < reminders.length; i++) {
                        let titolo = snapshot.child(i.toString() + '/titolo').val();
                        let elementi = snapshot.child(i.toString() + '/elementi').val();

                        let title = 'Lista ' + titolo;
                        let subtitle = elementi;
                        let buttonPostbackOne = 'Modifica lista ' + titolo;
                        let buttonPostbackTwo = 'Elimina lista ' + titolo;
                        if (senderID.toString().length > 9) {
                            elements[i] = elementWithTwoButtons(title, reminderURL, subtitle, buttonPostbackOne, buttonPostbackTwo);
                            localBasePayload.facebook.attachment.payload.elements[i] = elements[i];
                        } else {
                            elements[i] = new Card({
                               title: title,
                               imageUrl: reminderURL,
                               text: subtitle,
                               buttonText: 'Elimina',
                               buttonUrl: buttonPostbackTwo
                            });
                        }

                    }
                    console.log('Payload ottenuto: ' + JSON.stringify(localBasePayload));
                    if (senderID.toString().length > 9) {
                        agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                    } else {
                        let i;
                        for (i=0; i < elements.length; i++) {
                            agent.add(elements[i]);
                        }
                    }

                } else {
                    let question = 'Non mi hai parlato delle tue liste. Vuoi aggiungerle?';
                    let suggestions = [
                        "Lista",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    function handleDeleteListsReminderInfo() {

        let senderID = getSenderID();
        var listsPath = admin.database().ref('pazienti/' + senderID + '/promemoria/liste/');
        var titoloLista = agent.parameters.titolo;

        return listsPath.once('value').then((function (snapshot) {

            // Ottengo indice lista selezionata dall'utente
            var i;
            var indexSelectedList;
            let actualListName;
            for (i=0; i < snapshot.val().length; i++) {
                actualListName = snapshot.child(i.toString() + '/titolo').val();
                if (titoloLista == actualListName) {
                    indexSelectedList = i;
                }
            }

            // Salvo tutto il JSON delle liste
            let allListsJSON = snapshot.val();

            // Rimuovo la lista selezionata dall'elenco e costruisco un nuovo JSON
            allListsJSON.splice(parseInt(indexSelectedList), 1);

            // Effettuo un update al livello di 'liste'
            listsPath.set(allListsJSON,
                function (error) {
                    if (error) {
                        console.log('Qualcosa e\' andato storto...');
                    } else {
                        console.log('Lista eliminata!');
                    }
            });

            // Decremento il contatore del numero delle liste
            var listCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/promemoriaListe/');
            return listCounterPath.once('value').then((snapshot) => {
                let numListe = snapshot.val();
                console.log('numListe: ' + numListe);
                listCounterPath.set(numListe - 1);
                agent.add('Lista eliminata!');
            });

        }));

    }

    function handleAddMoreElementsPerNameListsReminder(agent) {

        let senderID = getSenderID();
        var listsPath = admin.database().ref('pazienti/' + senderID + '/promemoria/liste/');
        var titoloLista = agent.parameters.titolo;
        var elementi = agent.parameters.elementi;

        return listsPath.once('value').then((function (snapshot) {

            // Ottengo indice lista selezionata dall'utente
            var i;
            var indexSelectedList;
            let actualListName;
            for (i=0; i < snapshot.val().length; i++) {
                actualListName = snapshot.child(i.toString() + '/titolo').val();
                if (titoloLista == actualListName) {
                    indexSelectedList = i;
                }
            }

            console.log('indexSelectedList: ' + indexSelectedList + '\n' +
                'titoloLista: ' + titoloLista + '\n' +
                'actualListName: ' + actualListName + '\n' +
                'elementi: ' + elementi);

            // Percorso lista selezionata
            let selectedListPath = listsPath.child(indexSelectedList);

            return selectedListPath.once('value').then((snapshot) => {

                let oldElementi = snapshot.child('elementi').val();
                console.log('Lista elementi attuali: ' + elementi);
                console.log('Lista elementi vecchi: ' + oldElementi);

                // Effettuo il merge delle liste
                let mergedList = oldElementi + ', ' + elementi;

                selectedListPath.update({
                    elementi: mergedList
                }, function (error) {
                    if (error) {
                        console.log('Qualcosa e\' andato storto...');
                    } else {
                        console.log('Lista aggiornata!');
                    }
                    agent.add('Ho aggiunto ' + elementi + ' alla tua lista!');
                });
            });

        }));

    }

    // save intolerance info
    function handleSaveIntoleranceInfo() {
        const descrizione = agent.parameters.descrizione;
        const farmaco = agent.parameters.farmaco;

        // Test
        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle intolleranze
        let intoleranceCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/intolleranze');

        return intoleranceCounterPath.once('value').then((snapshot) => {
            // Controllo quante intolleranze ha inserito il paziente
            let intoleranceCounterForUser = snapshot.val();
            console.log('Num intolleranze gia\' espressi: ' + intoleranceCounterForUser);

            // Creo path con id pari a quantita' di intolleranze espresse
            let intolerancePath = admin.database().ref('pazienti/' + senderID + '/intolleranze/' + intoleranceCounterForUser);

            const intolleranza = {
                descrizione:descrizione,
                farmaco:farmaco
            };

            //salvo intolleranza
            intolerancePath.set(intolleranza);

            // Incremento il numero di intolleranze di una unita'
            let intoleranceCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/intolleranze');
            intoleranceCounterPath.set(intoleranceCounterForUser + 1);
        });
    }

    // read intolerance info
    function handleReadIntoleranceInfo() {
        var senderID = getSenderID();
        return admin.database().ref('pazienti/' + senderID + '/intolleranze/').once('value').then((snapshot) => {

                let intollerances = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(intollerances));

                if(intollerances !== null) {
                    let arrayLength = Object.keys(intollerances).length;

                    // Se si ha una sola intolleranza parte questa frase
                    if (arrayLength === 1)
                        agent.add('La tua intolleranza e\' ' + snapshot.child('0/descrizione').val() + ', per cui assumi il farmaco ' + snapshot.child('0/farmaco').val());
                    else {
                        let botResponse = 'Le tue intolleranze sono ';
                        let assunzione = ', per cui assumi ';
                        let j, z;

                        let intolleranze = new Set();
                        let farmaci = new Set();

                        for (z=0; z < arrayLength; z++) {
                            let intolleranza = snapshot.child(z.toString() + '/descrizione').val();
                            let farmaco = snapshot.child(z.toString() + '/farmaco').val();
                            intolleranze.add(intolleranza);
                            farmaci.add(farmaco);
                        }

                        intolleranze.delete("undefined");
                        farmaci.delete("undefined");

                        let intolleranzeNoDuplicates = Array.from(intolleranze);
                        let farmaciNoDuplicates = Array.from(farmaci);

                        // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                        for (j=0; j < intolleranzeNoDuplicates.length; j++) {

                            // concateno la congiunzione
                            if (j === intolleranzeNoDuplicates.length - 1) {
                                botResponse = botResponse + ' e ';
                                assunzione = assunzione + ' e ';
                            }

                            // concateno l'allergia
                            botResponse = botResponse + intolleranzeNoDuplicates[j];
                            assunzione = assunzione + farmaciNoDuplicates[j];

                            // concateno la virgola solo per le prime n-1 allergie
                            if (j < intolleranzeNoDuplicates.length - 2) {
                                botResponse = botResponse + ', ';
                                assunzione = assunzione + ', ';

                            }
                            console.log('allergia in j-esima pos: ' + intolleranzeNoDuplicates[j]);
                            console.log('botResponse: ' + botResponse);
                            console.log('assunzione: ' + assunzione);

                        }
                        agent.add(botResponse + assunzione);
                    }
                } else {
                    let question = 'Non mi hai parlato delle tue intolleranze. Vuoi aggiungerle?';
                    let suggestions = [
                        "Intolleranze",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    // save Allergy info
    function handleSaveAllergyInfo() {
        const descrizione = agent.parameters.descrizione;
        const farmaco = agent.parameters.farmaco;

        const senderID = getSenderID();

        // Ottengo la posizione dei contatori delle allergie
        let allergyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/allergie');

        return allergyCounterPath.once('value').then((snapshot) => {
            // Controllo quante allergie ha inserito il paziente
            let allergyCounterForUser = snapshot.val();
            console.log('Num intolleranze gia\' espressi: ' + allergyCounterForUser);

            // Creo path con id pari a quantita' di allergie espresse
            let allergyPath = admin.database().ref('pazienti/' + senderID + '/allergie/' + allergyCounterForUser);

            const allergia = {
                descrizione:descrizione,
                farmaco:farmaco
            };

            allergyPath.set(allergia);
            // Incremento il numero di intolleranze di una unita'
            let allergyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/allergie');
            allergyCounterPath.set(allergyCounterForUser + 1);
        });
    }

    // read allergy info
    function handleReadAllergyInfo() {
        var senderID = getSenderID();
        return admin.database().ref('pazienti/' + senderID + '/allergie/').once('value').then((snapshot) => {

                let allergies = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(allergies));

                if(allergies !== null) {
                    let arrayLength = Object.keys(allergies).length;

                    // Se si ha una sola allergia parte questa frase
                    if (arrayLength === 1)
                        agent.add('La tua allergia e\' ' + snapshot.child('0/descrizione').val() + ', per cui assumi il farmaco ' + snapshot.child('0/farmaco').val());
                    else {
                        let botResponse = 'Le tue allergie sono ';
                        let assunzione = ', per cui assumi ';
                        let j, z;

                        let allergie = new Set();
                        let farmaci = new Set();

                        for (z=0; z < arrayLength; z++) {
                            let allergia = snapshot.child(z.toString() + '/descrizione').val();
                            let farmaco = snapshot.child(z.toString() + '/farmaco').val();
                            allergie.add(allergia);
                            farmaci.add(farmaco);
                        }

                        console.log(allergie);
                        console.log(farmaci);

                        allergie.delete("undefined");
                        farmaci.delete("undefined");

                        let allergieNoDuplicates = Array.from(allergie);
                        let farmaciNoDuplicates = Array.from(farmaci);

                        // minore della lunghezza meno uno per la previsione della virgola e non della congiunzione
                        for (j=0; j < allergieNoDuplicates.length; j++) {

                            // concateno la congiunzione
                            if (j === allergieNoDuplicates.length - 1) {
                                botResponse = botResponse + ' e ';
                                assunzione = assunzione + ' e ';
                            }

                            // concateno l'allergia
                            botResponse = botResponse + allergieNoDuplicates[j];
                            assunzione = assunzione + farmaciNoDuplicates[j];

                            // concateno la virgola solo per le prime n-1 allergie
                            if (j < allergieNoDuplicates.length - 2) {
                                botResponse = botResponse + ', ';
                                assunzione = assunzione + ', ';

                            }
                            console.log('allergia in j-esima pos: ' + allergieNoDuplicates[j]);
                            console.log('botResponse: ' + botResponse);
                            console.log('assunzione: ' + assunzione);

                        }
                        agent.add(botResponse + assunzione);
                    }
                } else {
                    let question = 'Non mi hai parlato delle tue allergie. Vuoi aggiungerle?';
                    let suggestions = [
                        "Allergie",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    // save emergency number info
    function handleSaveEmergencyCall() {
        const nome = agent.parameters.nome;
        const numero = '+39' + agent.parameters.numero;

        const senderID = getSenderID();

        let emergencyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/emergenza');

        return emergencyCounterPath.once('value').then((snapshot) => {
            let emergencyCounterForUser = snapshot.val();
            console.log('Num emergenza gia\' espressi: ' + emergencyCounterForUser);

            if (emergencyCounterForUser > 2) {
                agent.add('Hai raggiunto il limite massimo di inserimento per i numeri di emergenza.');
            } else {
                let emergencyPath = admin.database().ref('pazienti/' + senderID + '/emergenza/' + emergencyCounterForUser);

                const emergenza = {
                    nome:nome,
                    numero:numero
                };

                emergencyPath.set(emergenza);
                let emergencyCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/emergenza');
                emergencyCounterPath.set(emergencyCounterForUser + 1);
            }
        });
    }

    // get sender id from facebook or dialogflow user
    function getSenderID() {
        var array = Object.keys(agent.originalRequest.payload);
        if(array.length > 0) {
            console.log(JSON.stringify(agent.originalRequest.payload));
            if (agent.originalRequest.source === 'telegram')
                return agent.originalRequest.payload.data.from.id;
            else return getFacebookSenderID();
        } else {
            return getDialogflowSenderID();
        }
    }

    function getGoogleSenderID(){
        return request.body.originalDetectIntentRequest;
    }

    // get facebook sender id
    function getFacebookSenderID() {
        return request.body.originalDetectIntentRequest.payload.data.sender.id;
    }

    // get dialogflow sender id
    function getDialogflowSenderID() {
        var array = request.body.queryResult.outputContexts;
        if (array.length > 2) {
            return request.body.queryResult.outputContexts[1].parameters.facebook_sender_id;
        } else {
            return request.body.queryResult.outputContexts[0].parameters.facebook_sender_id;
        }
    }

    function handleCheckBaseInfo(agent) {
        var senderID = getSenderID();
        return admin.database().ref('pazienti/' + senderID + '/generalita').once('value').then((snapshot) => {
           var generalita = snapshot.val();
           if (generalita != null) {
               let question = 'Hai già inserito le tue generalità. Hai bisogno di altro?';
               let suggestions = [
                   "Mostra funzionalità",
                   "Cancella"
               ];
               setSuggestions(question, suggestions, senderID);
           } else {
               let question = 'Tutte le informazioni da te inserite mi serviranno per aiutarti quando ne avrai bisogno, ti ricordo che puoi interrompere l\'inserimento in qualsiasi momento scrivendo \"cancella\". Vuoi andare avanti? ☺️';
               let suggestions = [
                   "Avanti",
                   "Cancella"
               ];
               setSuggestions(question, suggestions, senderID);
           }
        });
    }

    //save base info on Firebase
    function handleSaveBaseInfo(agent) {
        const nome = agent.parameters.nome;
        const cognome = agent.parameters.cognome;
        const eta = agent.parameters.eta;
        const dataNascita = agent.parameters.dataNascita;
        const luogoNascita = agent.parameters.luogoNascita;
        const luogoResidenza = agent.parameters.luogoResidenza;

        const senderID = getSenderID();

        const paziente = {
            nome:nome,
            cognome:cognome,
            eta:eta,
            dataNascita:dataNascita,
            luogoNascita:luogoNascita,
            luogoResidenza:luogoResidenza
        };

        let question = 'Piacere di conoscerti ' + nome + '! ☺️' + ' Ti va di continuare a darmi altre informazioni?';
        let suggestions = [
            "Aggiungi",
            "No grazie",
            "Cancella"
        ];
        setSuggestions(question, suggestions, senderID);

        return admin.database().ref('pazienti/' + senderID + '/generalita')
            .update(paziente)
            .then((snapshot) => {
        });
    }

    // recupero delle generalità da fornire su richiesta dell'utente
    function handleReadBaseInfo(agent) {

        var nome = request.body.queryResult.parameters.nome;
        var cognome = request.body.queryResult.parameters.cognome;
        var eta = request.body.queryResult.parameters.eta;
        var dataNascita = request.body.queryResult.parameters.dataNascita;
        var luogoNascita = request.body.queryResult.parameters.luogoNascita;
        var luogoResidenza = request.body.queryResult.parameters.luogoResidenza;

        const senderID = getSenderID();

        // check user request on name
        if(nome !== "") {
            return admin.database().ref('pazienti/' + senderID + '/generalita/nome').once('value').then((snapshot) => {
                console.log('snapshot if innestati (nome): ' + snapshot.val());
                let nome = snapshot.val();

                if(nome !== null) {
                    agent.add('Il tuo nome è ' + nome);
                } else {
                    let question = 'Non mi hai detto come ti chiami. Vuoi aggiungere le tue generalità?';
                    let suggestions = [
                        "Generalità",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
            });
        }

        // check user request on surname
        if(cognome !== "") {
                return admin.database().ref('pazienti/' + senderID + '/generalita/cognome')
                    .once('value')
                    .then((snapshot) => {
                    console.log('snapshot if innestati (cognome): ' + snapshot.val());
                    let cognome = snapshot.val();
                    if(cognome !== null) {
                        agent.add('Il tuo cognome è ' + cognome);
                    } else {
                        let question = 'Non mi hai detto qual è il tuo cognome. Vuoi aggiungere le tue generalità?';
                        let suggestions = [
                            "Generalità",
                            'Più tardi',
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }

        // check user request on age
        if(eta !== "") {
            return admin.database().ref('pazienti/' + senderID + '/generalita/eta')
                .once('value')
                .then((snapshot) => {
                        console.log('snapshot if innestati (eta): ' + snapshot.val());
                        let eta = snapshot.val();
                        if(eta !== null) {
                            agent.add('Hai ' + eta + ' anni.');
                        } else {
                            let question = 'Non mi hai dato alcuna informazione sulla tua età. Vuoi aggiungere le tue generalità?';
                            let suggestions = [
                                "Generalità",
                                'Più tardi',
                                "No grazie",
                                "Cancella"
                            ];
                            setSuggestions(question, suggestions, senderID);
                        }
                });
        }

        // check user request on birth date
        if(dataNascita !== "") {
            return admin.database().ref('pazienti/' + senderID + '/generalita/dataNascita')
                .once('value')
                .then((snapshot) => {
                    console.log('snapshot if innestati (dataNascita): ' + snapshot.val());

                    let dataNascita = snapshot.val();

                    if(dataNascita !== null) {
                        agent.add('La tua data di nascita è ' + getDate(dataNascita));
                    } else {
                        let question = 'Non mi hai dato alcuna informazione sulla tua data di nascita. Vuoi aggiungere le tue generalità?';
                        let suggestions = [
                            "Generalità",
                            'Più tardi',
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }

        // check user request on birth place
        if(luogoNascita !== "") {
            return admin.database().ref('pazienti/' + senderID + '/generalita/luogoNascita')
                .once('value')
                .then((snapshot) => {
                    console.log('snapshot if innestati (luogoNascita): ' + snapshot.val());

                    let luogoNascita = snapshot.val();
                    if(luogoNascita !== null) {
                        agent.add('Il tuo luogo di nascita è ' + luogoNascita);
                    } else {
                        let question = 'Non mi hai dato alcuna informazione sul tuo luogo di nascita. Vuoi aggiungere le tue generalità?';
                        let suggestions = [
                            "Generalità",
                            'Più tardi',
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }

        // check user request on home
        if(luogoResidenza !== "") {
            return admin.database().ref('pazienti/' + senderID + '/generalita/luogoResidenza')
                .once('value')
                .then((snapshot) => {
                    console.log('snapshot if innestati (luogoResidenza): ' + snapshot.val());

                    let luogoResidenza = snapshot.val();
                    if(luogoResidenza !== null) {
                        agent.add('Abiti a ' + snapshot.child('0/city').val() + ' in ' + snapshot.child('0/street-address').val());
                    } else {
                        let question = 'Non mi hai dato alcuna informazione sul dove abiti. Vuoi aggiungere le tue generalità?';
                        let suggestions = [
                            "Generalità",
                            'Più tardi',
                            "No grazie",
                            "Cancella"
                        ];
                        setSuggestions(question, suggestions, senderID);
                    }
                });
        }
    }

    // retrieve all base info
    function handleReadAllBaseInfo() {
        // Payload base
        let localBasePayload = fbBasePayload;
        let senderID = getSenderID();
        let identityCardURL = identityCard;

        return admin.database().ref('pazienti/' + senderID + '/generalita/').once('value').then((snapshot) => {

                let generalities = snapshot.val();
                console.log('snapshot.val() : ' + JSON.stringify(generalities));

                if(generalities !== null) {
                    let nome = snapshot.child('nome').val();
                    console.log(nome);
                    let cognome = snapshot.child('cognome').val();
                    console.log(cognome);

                    let dataNascita = snapshot.child('dataNascita').val();
                    let partialDate = getDate(dataNascita);
                    console.log(partialDate);


                    let eta = snapshot.child('eta').val();
                    let luogoNascita = snapshot.child('luogoNascita').val();

                    let street = snapshot.child('luogoResidenza/0/street-address').val();
                    let city = snapshot.child('luogoResidenza/0/city').val();
                    let luogoResidenza = street + ', ' + city;
                    console.log(luogoResidenza);


                    let title = nome + ' ' + cognome + ' ' + eta + ' anni';
                    let subtitle = 'Nato a ' + luogoNascita + '\n' + 'il ' + partialDate + '\n' + 'Residente in ' +
                        luogoResidenza;

                    console.log(title);
                    console.log(subtitle);

                    let elemento = element(title, identityCardURL, subtitle);

                    localBasePayload.facebook.attachment.payload.elements[0] = elemento;

                    agent.add(new Payload('FACEBOOK', localBasePayload, {rawPayload: true, sendAsMessage: true}));
                } else {
                    let question = 'Non mi hai parlato delle tue generalità. Vuoi aggiungerle?';
                    let suggestions = [
                        "Generalità",
                        'Più tardi',
                        "No grazie",
                        "Cancella"
                    ];
                    setSuggestions(question, suggestions, senderID);
                }
        });
    }

    function element(title, imageURL, subtitle) {
        var element =
            {
            "title":title,
            "image_url":imageURL,
            "subtitle":subtitle,
            };
        return element;
    }

    function elementWithButton(title, imageURL, subtitle, buttonText, buttonPostback) {
        var element =
            {
                "title":title,
                "image_url":imageURL,
                "subtitle":subtitle,
                "buttons":[
                    {
                        "type":"postback",
                        "title":buttonText,
                        "payload":buttonPostback
                    }
                ]
            };

        return element;
    }

    function elementWithTwoButtons(title, imageURL, subtitle, buttonPostbackOne, buttonPostbackTwo) {
        var element =
            {
                "title":title,
                "image_url":imageURL,
                "subtitle":subtitle,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Modifica",
                        "payload":buttonPostbackOne
                    },
                    {
                        "type":"postback",
                        "title":"Elimina",
                        "payload":buttonPostbackTwo
                    }
                ]
            };

        return element;
    }

    function handleGetNavigationInfo() {

        var navigationPayload =
            {
                "facebook": {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type":"generic",
                            "elements":[
                                {
                                    "title":"Vai alla navigazione",
                                    "image_url":"https://www.google.com/maps/d/u/0/thumbnail?mid=1ksQvIlnDYIH3zAmUj3R-E0Goei4&hl=it",
                                    "subtitle":"Scegli il servizio più adatto a te",
                                    "buttons":[
                                        {
                                            "type":"web_url",
                                            "url":"https://www.google.it/maps/dir/Via+San+Carlo,+44,+I-70010+Capurso+BA,+Italy/Mola+di+Bari,+BA",
                                            "title":"Google Maps"
                                        },
                                        {
                                            "type":"web_url",
                                            "url":"http://maps.apple.com/?saddr=Via+San+Carlo,+44,+I-70010+Capurso+BA&daddr=Mola+di+Bari,+BA",
                                            "title":"Apple Maps"
                                        }
                                    ]
                                },
                            ]
                        }
                    }
                }
            };

        var payloadToSend = new Payload('FACEBOOK', navigationPayload, {rawPayload: true, sendAsMessage: true});
        agent.add(payloadToSend);
    }

    function handleReadEmergencyCall() {

        let senderID = getSenderID();
        let path = 'pazienti/' + senderID + '/emergenza';
        var localEmergencyPayload = emergencyPayload;

        return admin.database().ref(path).once('value').then((snapshot) => {

            let emergencyItems = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(emergencyItems));

            if(emergencyItems !== null) {
                let i;
                let buttons = [];

                for (i=0; i < emergencyItems.length; i++) {
                    let nome = snapshot.child(i.toString() + '/nome').val();
                    let numero = snapshot.child(i.toString() + '/numero').val();

                    let buttonTitle = nome;
                    let buttonPostback = numero;
                    buttons[i] = callButton(buttonTitle, buttonPostback);

                    localEmergencyPayload.facebook.attachment.payload.buttons[i] = buttons[i];
                }
                console.log('Payload ottenuto: ' + JSON.stringify(localEmergencyPayload));
                agent.add(new Payload('FACEBOOK', localEmergencyPayload, {rawPayload: true, sendAsMessage: true}));

            } else {
                let question = 'Non hai inserito numeri di emergenza. Vuoi aggiungerne uno?';
                let suggestions = [
                    "Numeri Emergenza",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });

    }

    function handleChooseForDeleteEmergencyCall() {

        let senderID = getSenderID();
        let path = 'pazienti/' + senderID + '/emergenza';
        var localEmergencyPayload = emergencyPayload;

        // Cambio testo in relazione all'azione di eliminazione da effettuare
        localEmergencyPayload.facebook.attachment.payload.text = 'Ti ricordo che premendo sul nome il contatto verrà eliminato definitivamente! Quale contatto vuoi eliminare?';

        return admin.database().ref(path).once('value').then((snapshot) => {

            let emergencyItems = snapshot.val();
            console.log('snapshot.val() : ' + JSON.stringify(emergencyItems));

            if(emergencyItems !== null) {
                let i;
                let buttons = [];

                for (i=0; i < emergencyItems.length; i++) {
                    let nome = snapshot.child(i.toString() + '/nome').val();

                    let buttonTitle = nome;
                    let buttonPostback = 'Cancella numero emergenza ' + nome;
                    buttons[i] = postbackButton(buttonTitle, buttonPostback);

                    localEmergencyPayload.facebook.attachment.payload.buttons[i] = buttons[i];
                }
                console.log('Payload ottenuto: ' + JSON.stringify(localEmergencyPayload));
                agent.add(new Payload('FACEBOOK', localEmergencyPayload, {rawPayload: true, sendAsMessage: true}));

            } else {
                let question = 'Non hai inserito numeri di emergenza. Vuoi aggiungerne uno?';
                let suggestions = [
                    "Numeri Emergenza",
                    'Più tardi',
                    "No grazie",
                    "Cancella"
                ];
                setSuggestions(question, suggestions, senderID);
            }
        });

    }

    function handleDeleteEmergencyCall() {

        let senderID = getSenderID();
        var listsPath = admin.database().ref('pazienti/' + senderID + '/emergenza/');
        var nome = agent.parameters.nome;

        return listsPath.once('value').then((function (snapshot) {

            // Ottengo indice numero selezionato dall'utente
            var i;
            var indexSelectedList;
            let actualName;
            for (i=0; i < snapshot.val().length; i++) {
                actualName = snapshot.child(i.toString() + '/nome').val();
                if (nome == actualName) {
                    indexSelectedList = i;
                }
            }

            // Salvo tutto il JSON dei numeri di telefono
            let allItemsJSON = snapshot.val();

            // Rimuovo la lista selezionata dall'elenco e costruisco un nuovo JSON
            allItemsJSON.splice(parseInt(indexSelectedList), 1);

            // Effettuo un update al livello di 'emergenza'
            listsPath.set(allItemsJSON,
                function (error) {
                    if (error) {
                        console.log('Qualcosa e\' andato storto...');
                    } else {
                        console.log('Numero eliminato!');
                    }
                });

            // Decremento il contatore del numero dei numeri di telefono
            var listCounterPath = admin.database().ref('pazienti/' + senderID + '/counters/emergenza/');
            return listCounterPath.once('value').then((snapshot) => {
                let numNumeri = snapshot.val();
                console.log('numListe: ' + numNumeri);
                listCounterPath.set(numNumeri - 1);
                agent.add('Numero eliminato!');
            });

        }));

    }


    function callButton(relativeName, relativePhoneNumber) {
        return {
            "type":"phone_number",
            "title":relativeName,
            "payload":relativePhoneNumber
        };
    }

    function postbackButton(relativeName, relativeTrainingPhrase) {
        return {
            "type":"postback",
            "title":relativeName,
            "payload":relativeTrainingPhrase
        };
    }

    function tgCard(url, title, subtitle) {

        agent.add(new Card({
            title: title,
            imageUrl: url,
            text: subtitle
        }));
    }

    function setSuggestions(question, suggArray, senderID) {

        let lengthID = senderID.toString().length;
        let numOfSuggestions = suggArray.length;

        console.log('lengthID: ' + lengthID);
        console.log('numOfSuggestions' + numOfSuggestions);

        // Controllo suggerimenti per piattaforma
        if (lengthID > 9) {
            let i;
            let objectsArray = [];
            for (i=0; i < numOfSuggestions; i++) {
                objectsArray[i] = fbKeycap(suggArray[i]);
            }
            fbQuickReply(agent, question, objectsArray);

        } else {

            const size = 2;
            let i;
            let objectsArray = [];

            // Trasformazione stringhe dei suggerimenti in pulsanti in formato JSON...
            for (i=0; i < numOfSuggestions; i++) {
                objectsArray[i] = tgKeycap(suggArray[i]);
            }

            // Costruzione dei sottoarray innestati all'array "keyboard":
            // ogni sottoarray costituirà una nuova riga di pulsanti per Telegram
            const kArray = objectsArray.reduce((acc, curr, i) => {
                if ( !(i % size)  ) {    // se l'indice è 0 o è divisibile per l'intero rappresentante la lunghezza dell'array..
                    acc.push(objectsArray.slice(i, i + size));   // ..effettua il push dell'array "tagliato" nell'accumulatore
                }
                return acc;
            }, []);

            let arrayToPrint = [];
            let index;
            for (index=0; index < kArray; index++) {
                arrayToPrint[index] = JSON.stringify(kArray[index]);
            }
            console.log('kArray: ' + JSON.stringify(kArray));
            console.log('arrayToPrint: ' + JSON.stringify(arrayToPrint));
            console.log('objectsArray: ' + JSON.stringify(objectsArray));

            tgKeyboard(agent, question, kArray);
        }
    }


    function tgKeyboard(agent, question, kArray) {

        var payload =
            {
                "text": question,
                "reply_markup":
                    {
                        "one_time_keyboard": true,
                        "resize_keyboard": true,
                        "keyboard": kArray
                    }
            };

        console.log('payload Telegram Finale: ' + JSON.stringify(payload));
        agent.add(new Payload(agent.TELEGRAM, payload, {sendAsMessage: true, rawPayload: false}));
    }

    function fbQuickReply(agent, question, fbArray) {

        let payload =
            {
                "text": question,
                "quick_replies":fbArray
            };

        console.log('payload Facebook Finale: ' + JSON.stringify(payload));
        agent.add(new Payload('FACEBOOK', payload, {rawPayload: false, sendAsMessage: false}));
    }

    function fbKeycap(text) {
        return {
            "content_type":"text",
            "title": text,
            "payload": text
        };
    }

    function tgKeycap(text) {
        return {
            "text": text,
            "callback_data": text
        };
    }

    
    // Run the proper function handler based on the matched Dialogflow intent name
    let intentMap = new Map();
    intentMap.set('Default Fallback Intent', fallback);
    intentMap.set('benvenuto', benvenuto);

    // generalità
    intentMap.set('checkBaseInfo', handleCheckBaseInfo);
    intentMap.set('askBaseInfo', handleSaveBaseInfo);
    intentMap.set('getBaseInfo', handleReadBaseInfo);

    // intolleranze e allergie
    intentMap.set('askIntoleranceInfo', handleSaveIntoleranceInfo);
    intentMap.set('getIntoleranceInfo', handleReadIntoleranceInfo);

    intentMap.set('askAllergyInfo', handleSaveAllergyInfo);
    intentMap.set('getAllergyInfo', handleReadAllergyInfo);

    // emergenza
    intentMap.set('askEmergencyNumber', handleSaveEmergencyCall);
    intentMap.set('getEmergencyNumber', handleReadEmergencyCall);
    intentMap.set('chooseEmergencyNumber', handleChooseForDeleteEmergencyCall);
    intentMap.set('deleteEmergencyNumber', handleDeleteEmergencyCall);

    // terapia giornaliera
    intentMap.set('askDailyTherapy', handleSaveDailyTherapyInfo);
    intentMap.set('getDailyTherapy', handleReadDailyTherapiesInfo);

    // terapia intervallare
    intentMap.set('askIntervalTherapy', handleSaveIntervalTherapyInfo);
    intentMap.set('getIntervalTherapy', handleReadIntervalTherapiesInfo);

    // ricordi
    intentMap.set('askMemoriesInfo', handleSaveMemoriesInfo);
    intentMap.set('askMemoriesInfo - addPhoto', handleSaveMemoriesPhoto);
    intentMap.set('getMemoriesInfo', handleReadMemoriesInfo);

    // parenti
    intentMap.set('askRelativesInfo', handleSaveRelativesInfo);
    intentMap.set('askRelativesInfo - addPhoto', handleSaveRelativesPhoto);
    intentMap.set('getRelativesInfo', handleReadRelativesInfo);
    intentMap.set('getAllRelativesInfo', handleReadAllRelativesInfo);
    // preferenze musicali
    intentMap.set('askMusicPref', handleSaveMusicPrefInfo);

    // preferenze cinematografiche
    intentMap.set('askMoviePref', handleSaveMoviePrefInfo);

    // preferenze teatrali
    intentMap.set('askTheatrePref', handleSaveTheatrePrefInfo);

    // preferenze sportive
    intentMap.set('askSportPref', handleSaveSportPrefInfo);

    // preferenze alimentari
    intentMap.set('askFoodPref', handleSaveFoodPrefInfo);

    // promemoria programmato
    intentMap.set('askProgReminder', handleSaveProgReminderInfo);

    // promemoria ripetuto
    intentMap.set('askRoutineReminder', handleSaveRoutineReminderInfo);

    // promemoria lista
    intentMap.set('askListReminder', handleSaveListsReminderInfo);
    intentMap.set('askListReminder - no - addMore', handleAddMoreElementsListsReminder);

    // retrieve base info
    intentMap.set('getBaseInfo', handleReadBaseInfo);

    // retrieve all base info
    intentMap.set('getAllBaseInfo', handleReadAllBaseInfo);

    // retrieve all music pref
    intentMap.set('getAllMusicPref', handleReadAllMusicPrefInfo);

    // retrieve all movie info
    intentMap.set('getAllMoviePref', handleReadAllMoviePrefInfo);

    // retrieve all theatre info
    intentMap.set('getAllTheatrePref', handleReadAllTheatrePrefInfo);

    // retrieve all sport info
    intentMap.set('getAllSportPref', handleReadAllSportPrefInfo);

    // retrieve all food pref info
    intentMap.set('getAllFoodPref', handleReadAllFoodPrefInfo);

    // retrieve music pref info
    intentMap.set('getMusicPrefInfo', handleReadMusicPrefInfo);

    // retrieve movie pref info
    intentMap.set('getMoviePrefInfo', handleReadMoviePrefInfo);

    // retrieve theatre pref info
    intentMap.set('getTheatrePrefInfo', handleReadTheatrePrefInfo);

    // retrieve sport pref info
    intentMap.set('getSportPref', handleReadSportPrefInfo);

    // retrieve food pref info
    intentMap.set('getFoodPref', handleReadFoodPrefInfo);

    // retreve prog reminder info
    intentMap.set('getProgReminder', handleReadProgReminderInfo);
    intentMap.set('deleteProgReminder', handleDeleteProgReminderInfo);

    // retrieve routine reminder info
    intentMap.set('getRoutineReminder', handleReadRoutineReminderInfo);

    // retrieve list reminder info
    intentMap.set('getListReminder', handleReadListsReminderInfo);
    intentMap.set('editListReminder', handleAddMoreElementsPerNameListsReminder);
    intentMap.set('deleteListReminder', handleDeleteListsReminderInfo);

    // retrieve navigation info
    intentMap.set('getNavigationInfo', handleGetNavigationInfo);

    // intentMap.set('your intent name here', googleAssistantHandler);
    agent.handleRequest(intentMap);
});