//constants
const fetchURL = 'https://opentdb.com/api.php?amount=45&type=multiple';
const choices = ['a','b','c','d'];
const bgPlayer = new Audio('../audio/MainTheme.mp3');

//state variables
var qNum;           //represented as number 1-15 that the playe is on
var questions;      //array of questions
var questionToAsk;  //question object chosen to ask the player
var prevAskedQuestions; 
var lifelines       //lifeline booleans
var audianceGraphURL;   //URL for API of quickchart.io, uses graph objects from chart.js


//cached elements
var arrowEl = document.querySelector('.arrow');
var questionEl = document.querySelector('.question');
var aEl = document.querySelector('.a');
var bEl = document.querySelector('.b');
var cEl = document.querySelector('.c');
var dEl = document.querySelector('.d');
var answerPanelEl = document.querySelector('section');
var bgMusicCheckBox = document.querySelector('input.backgroundmusic');
var newGameBtnEl = document.querySelector('.newgame')
var lifelinesEl = document.querySelector('.lifelines');
var frontImg =document.querySelector('.frontimg');

//event listeners
answerPanelEl.addEventListener('click', checkAnswer);
bgMusicCheckBox.addEventListener('change', toggleBgMusic);
newGameBtnEl.addEventListener('click',init);
lifelinesEl.addEventListener('click', lifelineHandler);

//functions
function render(){

    questionEl.textContent = decodeHtml(questionToAsk.question); 
    aEl.textContent = `${questionToAsk.incorrect_answers[0]}`;
    bEl.textContent = `${questionToAsk.incorrect_answers[1]}`;
    cEl.textContent = `${questionToAsk.incorrect_answers[2]}`;
    dEl.textContent = `${questionToAsk.incorrect_answers[3]}`;
    for (lifeline in lifelines) {
        let lifelineEl = document.querySelector(`.${lifeline}`);
        if (!lifelines[lifeline]) {
            lifelineEl.setAttribute('src','../images/redX.png');
        } else {
            lifelineEl.setAttribute('src',"");
        }
    }
    arrowEl.style.gridRowStart = 17-qNum;
    if (audianceGraphURL) {
        frontImg.setAttribute('src',audianceGraphURL);
    } else {
        frontImg.setAttribute('src','../images/elk.jpeg');
    }
    
}

async function init(){
    qNum = 1;
    prevAskedQuestions = [];
    audianceGraphURL = "";
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

function checkAnswer(evt){
    if (evt.target.className == 'question' || 
        evt.target.tagName == 'SECTION' ||
        evt.target.textContent == "") {return;}
    if (questionToAsk.incorrect_answers[choices.findIndex(letter => letter == evt.target.className)] == 
        questionToAsk.correct_answer) {
            prevAskedQuestions.push(questionToAsk);
            questions.splice(questions.findIndex(q => q == questionToAsk),1);
            qNum += 1;
            if (qNum>15){
                alert('PLAYER WINS. WOOHOOO!!! START NEW GAME');
            };
            nextQuestion();
    } else {
        alert('Game Over! Try Again');
        init();
    }
}

function nextQuestion(){
    audianceGraphURL = "";
    pickQuestion();
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

function lifelineHandler(evt){
    if (evt.target.getAttribute('src')) {return;}
    let lifeline = evt.target.className;
    if (lifeline == 'fifty') {
        let i = 0;
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
    } else if (lifeline == 'audiance') {
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

    }
}

// init();





// save this to sort and pick a question randomly
// in case i want to change to this scenario later

// questions.sort(function(q1,q2){
//     if (q1.difficulty == q2.difficulty) return 0;
//     if (q1.difficulty == 'easy') return -1;
//     if (q2.difficulty == 'easy') return 1;
//     if (q1.difficulty == 'hard') return 1;
//     if (q2.difficulty == 'hard') return -1;
// })