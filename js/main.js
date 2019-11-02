//constants
const fetchURL = 'https://opentdb.com/api.php?amount=45';
const choices = ['a','b','c','d'];
const bgPlayer = new Audio('../audio/MainTheme.mp3');

//state variables
var qNum;           //represented as number 1-15 that the playe is on
var questions;      //array of questions
var questionToAsk;  //question object chosen to ask the player
var prevAskedQuestions; 


//cached elements
var arrowEl = document.querySelector('.arrow');
var questionEl = document.querySelector('.question');
var aEl = document.querySelector('.a');
var bEl = document.querySelector('.b');
var cEl = document.querySelector('.c');
var dEl = document.querySelector('.d');
var answerPanelEl = document.querySelector('section');
var bgMusicCheckBox = document.querySelector('input.backgroundmusic');

//event listeners
answerPanelEl.addEventListener('click', checkAnswer);
bgMusicCheckBox.addEventListener('change', toggleBgMusic);

//functions
function render(){

    questionEl.textContent = decodeHtml(questionToAsk.question); 
    aEl.textContent = questionToAsk.incorrect_answers[0];
    bEl.textContent = questionToAsk.incorrect_answers[1];
    cEl.textContent = questionToAsk.incorrect_answers[2];
    dEl.textContent = questionToAsk.incorrect_answers[3];
    arrowEl.style.gridRowStart = 17-qNum;
}

async function init(){
    qNum = 1;
    prevAskedQuestions = [];
    questions = await getQuestions();     //stores questions in questions variable
    bgPlayer.play();
    bgPlayer.loop = true;
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
        questionToAsk = questions.find(q => q.difficulty == 'easy');
    }
    else if (qNum<11){
        questionToAsk = questions.find(q => q.difficulty == 'medium');
    }
    else {
        questionToAsk = questions.find(q => q.difficulty == 'hard');
    }
}

//inserts the correct answer into the array of 3 wrong answers randomly
function populateAnswers(){
    randIndex = Math.floor(Math.random()*3);
    questionToAsk.incorrect_answers.splice(randIndex,0,questionToAsk.correct_answer);
    console.log(questionToAsk.correct_answer);
}

function checkAnswer(evt){
    if (evt.target.className == 'question' || 
        evt.target.tagName == 'SECTION') {return;}
    if (questionToAsk.incorrect_answers[choices.findIndex(letter => letter == evt.target.className)] == 
        questionToAsk.correct_answer) {
            prevAskedQuestions.push(questionToAsk);
            questions.splice(questions.findIndex(q => q == questionToAsk),1);
            qNum += 1;
            nextQuestion();
    } else {
        alert('Game Over! Try Again');
        init();
    }
}

function nextQuestion(){
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
}

init();





// save this to sort and pick a question randomly
// in case i want to change to this scenario later

// questions.sort(function(q1,q2){
//     if (q1.difficulty == q2.difficulty) return 0;
//     if (q1.difficulty == 'easy') return -1;
//     if (q2.difficulty == 'easy') return 1;
//     if (q1.difficulty == 'hard') return 1;
//     if (q2.difficulty == 'hard') return -1;
// })