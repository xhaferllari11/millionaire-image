//constants
const fetchURL = 'https://opentdb.com/api.php?amount=45&type=multiple';
const choices = ['a','b','c','d'];
const bgPlayer = new Audio('audio/MainTheme.mp3');
const gameSounds = new Audio();
const soundsURLs = {
    'newGame': 'audio/letsPlay.mp3',
    'fifty':'audio/fiftysound.mp3',
    'audiance':'audio/audiancesound.mp3',
    'correct':'audio/correctAnswer.mp3',
    'wrong':'audio/wrongAnswer.mp3'
}

//state variables
var qNum;                   //represented as number 1-15 that the playe is on
var questions;              //array of questions
var questionToAsk;          //question object chosen to ask the player
var prevAskedQuestions; 
var lifelines;              //lifeline booleans
var audianceGraphURL;       //URL for API of quickchart.io, uses graph objects from chart.js
var muteSound;              //player selects to keep music on or off
var pickedAnswer;           //answer used picked
var pickedAnswerChecked;    //boolean to say if check answer was called
var phoneCallAns;           //phone call answer if phonecall lifeline used
var playerLost;             //boolean to disable buttons upon losing

//cached elements
var questionEl = document.querySelector('.question');
var aEl = document.querySelector('.a');
var bEl = document.querySelector('.b');
var cEl = document.querySelector('.c');
var dEl = document.querySelector('.d');
var answerPanelEl = document.querySelector('section');
var bgMusicCheckBox = document.querySelector('input.backgroundmusic');
var allMusicCheckBox = document.querySelector('input.allmusic');
var newGameBtnEl = document.querySelector('.newgame')
var lifelinesEl = document.querySelector('.lifelines');
var frontImgEl = document.querySelector('.frontimg');
var phoneCallerEl = document.querySelector('.phonecaller');
var phoneCallAnswerEl = document.querySelector('.phonecallanswer');
var highlightQNumberEl = document.querySelector('.highlight');

//event listeners
answerPanelEl.addEventListener('click', answerClick);
bgMusicCheckBox.addEventListener('change', toggleBgMusic);
allMusicCheckBox.addEventListener('change', allMusicHandler);
newGameBtnEl.addEventListener('click',init);
lifelinesEl.addEventListener('click', lifelineHandler);

//functions
function render(){
    questionEl.textContent = decodeHtml(questionToAsk.question); 
    aEl.textContent = (!questionToAsk.incorrect_answers[0]) ? "" : `A. ${questionToAsk.incorrect_answers[0]}`;
    bEl.textContent = (!questionToAsk.incorrect_answers[1]) ? "" : `B. ${questionToAsk.incorrect_answers[1]}`;
    cEl.textContent = (!questionToAsk.incorrect_answers[2]) ? "" : `C. ${questionToAsk.incorrect_answers[2]}`;
    dEl.textContent = (!questionToAsk.incorrect_answers[3]) ? "" : `D. ${questionToAsk.incorrect_answers[3]}`;
    for (lifeline in lifelines) {
        let lifelineEl = document.querySelector(`.${lifeline}`);
        if (!lifelines[lifeline]) {
            lifelineEl.setAttribute('src','images/redX.png');
        } else {
            lifelineEl.setAttribute('src',"");
        }
    }
    highlightQNumberEl.style.gridRowStart = 17-qNum;
    //case where audiance and phone call used in same turn
    if (phoneCallAns && audianceGraphURL){
        if (frontImgEl.getAttribute('src') == 'images/phonecallcloud.png'){
            frontImgEl.setAttribute('src',audianceGraphURL);
        } else {
            frontImgEl.setAttribute('src','images/phonecallcloud.png');
            phoneCallerEl.setAttribute('src','images/phonecall.png');
            phoneCallAnswerEl.textContent = phoneCallAns;    
        }
    } else{
        if (phoneCallAns) {
            frontImgEl.setAttribute('src','images/phonecallcloud.png');
            phoneCallerEl.setAttribute('src','images/phonecall.png');
            phoneCallAnswerEl.textContent = phoneCallAns;
        } else {
            frontImgEl.setAttribute('src','images/logo.png');
            phoneCallerEl.removeAttribute('src');
            phoneCallAnswerEl.textContent = '';
        }
        if (audianceGraphURL) {
            frontImgEl.setAttribute('src',audianceGraphURL);
            phoneCallerEl.removeAttribute('src');
            phoneCallAnswerEl.textContent = '';
        } else if (!phoneCallAns){
            frontImgEl.setAttribute('src','images/logo.png');
        }
    }

    if (pickedAnswerChecked && pickedAnswer ){
        let correctAnswerLetter = choices[questionToAsk.incorrect_answers.findIndex(ans => ans == questionToAsk.correct_answer)];
        answerPanelEl.style.backgroundImage = `url(images/choice${pickedAnswer + correctAnswerLetter}answer.png)`;
    } else if (pickedAnswer) {
        answerPanelEl.style.backgroundImage = `url(images/choice${pickedAnswer}.png)`;
    } else {
        answerPanelEl.style.backgroundImage = `url(images/template5.png)`;        
    }    
}

function renderSound(whichSound){
    gameSounds.setAttribute('src', soundsURLs[whichSound]);
    muteSound ? gameSounds.removeAttribute('src') : gameSounds.play();
}

async function init(){
    renderSound('newGame');
    qNum = 0;
    prevAskedQuestions = [];
    audianceGraphURL = "";
    playerLost = false;
    questions = await getQuestions();     //stores questions in questions variable
    lifelines = {
        'fifty': true,
        'audiance': true,
        'phone': true
    };
    toggleBgMusic();
    nextQuestion();
}

async function getQuestions() {
    const response = await fetch(fetchURL);
    const data = await response.json();
    return data.results; 
}

//finds first question with desired difficulty
function pickQuestion(){
    if (qNum<6){
        questionToAsk = (questions.find(q => q.difficulty == 'easy')) ?
        questions.find(q => q.difficulty == 'easy') :
        questions.find(q => q.difficulty == 'medium');
    }
    else if (qNum<11){
        questionToAsk = (questions.find(q => q.difficulty == 'medium')) ?
        questions.find(q => q.difficulty == 'medium') :
        questions.find(q => q.difficulty == 'easy');
    }
    else {
        questionToAsk = (questions.find(q => q.difficulty == 'hard')) ?
        questions.find(q => q.difficulty == 'hard') :
        questions.find(q => q.difficulty == 'medium');
    }
}

//inserts the correct answer into the array of 3 wrong answers randomly
function populateAnswers(){
    let randIndex = Math.floor(Math.random()*3);    //picks randomn number 1-3
    questionToAsk.incorrect_answers.splice(randIndex,0,questionToAsk.correct_answer);
    console.log(questionToAsk.correct_answer);
}

function answerClick(evt){
    if (evt.target.className == 'question' || 
        evt.target.tagName == 'SECTION' ||
        evt.target.textContent == "" ||
        playerLost) {return;}
    pickedAnswer = evt.target.className;
    render();
    setTimeout(checkAnswer, 1500);
}     

function checkAnswer(){
    pickedAnswerChecked = true;
    if (questionToAsk.incorrect_answers[choices.findIndex(letter => letter == pickedAnswer)] == 
    questionToAsk.correct_answer) {
        renderSound('correct');
        render();
        if (qNum == 15) {
            setTimeout(function(){
                alert('Player Won!!!! Wooohooo. Hit New Game to play again');
            }, 2000)
        } else {setTimeout(nextQuestion, 1500)};
    } else {
        playerLost = true;
        for (life in lifelines){
            life = false;
        }
        renderSound('wrong');
        let winnings = 0;
        if (qNum >10){
            winnings = 32000;
            qNum = 10;
        } else if (qNum > 5) {
            winnings = 1000;
            qNum = 5;
        } 
        render();
        setTimeout(function(){
            alert(`Game Over! You won $${winnings}. Hit New Game to try again`);
        }, 2000);
    }
}

function nextQuestion(){
    if (questionToAsk){
        prevAskedQuestions.push(questionToAsk);                             //puts question in array of asked questions
        questions.splice(questions.findIndex(q => q == questionToAsk),1);   //deletes questions from list of questions
    }
    qNum += 1;
    if (qNum>15){
        alert('PLAYER WINS. WOOHOOO!!! START NEW GAME');
    };
    audianceGraphURL = "";
    phoneCallAns = "";
    pickedAnswer = null;
    pickedAnswerChecked = false;
    pickQuestion();
    //large string questions don't display well, so I'm removing
    while (questionToAsk.question.length > 100) {
        questions.splice(questions.findIndex(q => q == questionToAsk),1);   //deletes questions from list of questions
        pickQuestion();
    }   
    populateAnswers();
    render();
}

function decodeHtml(html) {
    let txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function toggleBgMusic(){
    bgMusicCheckBox.checked ? bgPlayer.pause() : bgPlayer.play(); 
    bgPlayer.loop = true;
}

function allMusicHandler(){
    if (allMusicCheckBox.checked) {
        muteSound = true;
        bgMusicCheckBox.checked = true;
        toggleBgMusic();
    }
    if (!allMusicCheckBox.checked) {
        muteSound = false;
    }
}

// Also consider making an object for each lifelife. Making put object in lifelines object
function lifelineHandler(evt){
    if (evt.target.getAttribute('src') || playerLost) {return;}
    let lifeline = evt.target.className;
    if (lifeline == 'fifty') {
        renderSound('fifty');
        let i = 0;
        // waste of time/space while loop
        while (i<2){
            let randIdx = Math.floor(Math.random()*4) //picks randomn number 1-4
            if (questionToAsk.incorrect_answers[randIdx] == questionToAsk.correct_answer) {
                continue;
            } else if (questionToAsk.incorrect_answers[randIdx]){
                questionToAsk.incorrect_answers[randIdx] = "";
                i +=1;
            }
        }
        lifelines.fifty = false;
        render();
    } else if (lifeline == 'audiance') {                //need logic for using 50/50 and audiance
        renderSound('audiance');
        let aRightPercent;
        let audianceResponses = [null, null, null, null];
        let rightAnswerIndex = questionToAsk.incorrect_answers.findIndex(ans => ans == questionToAsk.correct_answer);
        if (questionToAsk.difficulty == 'easy'){
            aRightPercent = Math.floor(75 + Math.random()*20);  //75-95% of audiance guesses right
        } else if (questionToAsk.difficulty == 'medium'){
            aRightPercent = Math.floor(55 + Math.random()*20);  //55-75% of audiance guesses right       
        } else if (questionToAsk.difficulty == 'hard'){
            aRightPercent = Math.floor(30 + Math.random()*25);  //30-55% of audiance guesses right
        }
        audianceResponses[rightAnswerIndex] = aRightPercent;
        //in case 50/50 was used before audiance
        if (questionToAsk.incorrect_answers.some(answer => answer == "")){
            audianceResponses[questionToAsk.incorrect_answers.findIndex(ans => (ans != "" && ans != questionToAsk.correct_answer))] = 100 - aRightPercent;     
            audianceResponses = audianceResponses.map(function(ans){
                if (!ans){return 0;}
                return ans;
            });
            audianceGraphURL = `https://quickchart.io/chart?backgroundColor=transparent&width=150&height=200&label=false&c={type:'bar',data:{labels:['A','B','C','D'], datasets:[{backgroundColor:'teal',label:'number of audiance',data:[${audianceResponses[0]},${audianceResponses[1]},${audianceResponses[2]},${audianceResponses[3]}]}]},options:{scales:{yAxes:[{ticks:{suggestedMin:0,suggestedMax:100}}]},title:{display:true,text:'Audiance Votes',fontColor:'black'},legend:{display:false},plugins:{datalabels:{display:false}}}}`;
            lifelines.audiance = false;
            render();
            return;
        }
        let otherAnswersPercent = [];
        otherAnswersPercent[0] = Math.floor(Math.random()*(100 - aRightPercent));
        otherAnswersPercent[1] = Math.floor(Math.random()*(100 - aRightPercent-otherAnswersPercent[0]));
        otherAnswersPercent[2] = 100 - otherAnswersPercent[0] - otherAnswersPercent[1] - aRightPercent;
        //assign remaining audiance percent randomly, waste of time code. find better way to assign each value randomnly
        let getRandNum = Math.random()*3;
        audianceResponses[audianceResponses.findIndex(element => !element)] = otherAnswersPercent.splice(getRandNum,1)[0];
        audianceResponses[audianceResponses.findIndex(element => !element)] = otherAnswersPercent.pop();
        audianceResponses[audianceResponses.findIndex(element => !element)] = otherAnswersPercent[0];
        audianceGraphURL = `https://quickchart.io/chart?backgroundColor=transparent&width=150&height=200&label=false&c={type:'bar',data:{labels:['A','B','C','D'], datasets:[{backgroundColor:'teal',label:'number of audiance',data:[${audianceResponses[0]},${audianceResponses[1]},${audianceResponses[2]},${audianceResponses[3]}]}]},options:{scales:{yAxes:[{ticks:{suggestedMin:0,suggestedMax:100}}]},title:{display:true,text:'Audiance Votes',fontColor:'black'},legend:{display:false},plugins:{datalabels:{display:false}}}}`;
        lifelines.audiance = false;
        render();
    } else if (lifeline == 'phone') {
        let aRightPercent;
        let rightAnswerIndex = questionToAsk.incorrect_answers.findIndex(ans => ans == questionToAsk.correct_answer);
        let callerGuessed = false;
        if (questionToAsk.difficulty == 'easy'){
            aRightPercent = Math.floor((70 + Math.random()*40)/10)*10;  //70-100% sure
        } else if (questionToAsk.difficulty == 'medium'){
            aRightPercent = Math.floor((50 + Math.random()*50)/10)*10;  //50-90% sure      
        } else if (questionToAsk.difficulty == 'hard'){
            aRightPercent = Math.floor((30 + Math.random()*50)/10)*10;  //30-70% of audiance guesses right
            //A 50% chance that caller guess a random answer
            if (Math.random()>.5){
                callerGuessed = true;
                //if 50/50 was used, caller guess first answer
                if (questionToAsk.incorrect_answers.some(answer => answer == "")){
                    rightAnswerIndex = questionToAsk.findIndex(ans => ans);
                } else {
                    //gets a random index
                    let randArray = [Math.random(),Math.random(),Math.random(),Math.random()];
                    let maxNum = Math.max(randArray[0],randArray[1],randArray[2],randArray[3]);
                    rightAnswerIndex = randArray.findIndex(num => num == maxNum);
                }
            }
        }
        phoneCallAns = (callerGuessed) ?
        `I think it's ${choices[rightAnswerIndex].toUpperCase()}. But it's a guess.` :
        `I think it's ${choices[rightAnswerIndex].toUpperCase()}. I'm ${aRightPercent}% sure. Good luck!`
        lifelines.phone = false;
        render();
    }
}