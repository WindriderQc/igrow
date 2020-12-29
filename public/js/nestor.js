



function setup()
{
  // let lang = navigator.language || 'fr-FR'   //  'en-US'
   let lang = 'en-US'
   console.log('language: ' + lang)
   let speechRec = new p5.SpeechRec(lang)
   speechRec.onResult = gotSpeech
   speechRec.start()
   //console.log(speechRec)


   function gotSpeech() {
      console.log(speechRec)
      if(speechRec.resultValue){
        createP(speechRec.resultString);
    }
   }

}


const mouth = new p5.Speech(); // speech synthesis object   
mouth.onLoad = voiceReady;
  
function voiceReady() {
   console.log('Speech recognition supported 😊')
   console.log(mouth.voices) 
   mouth.setVoice(1)
   mouth.setRate(1)
   mouth.setPitch(1)

   mouth.speak('How you doin baby?'); // say something

  // mouth.setVoice(6)
// mouth.speak('Caâlisss de tabârnack... Quessé tu fais la encore?'); // say something
}

