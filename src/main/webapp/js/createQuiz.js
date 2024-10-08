

var quizName = document.getElementById("quiz-name");
var quizCategory = document.getElementById("quiz-category");
var cardName = document.getElementById("quiz-card-name");
var cardCategory = document.getElementById("quiz-card-category");
var createQuestion = document.getElementById("create-question-btn");
var createQuiz = document.getElementById("create-quiz-btn");
var cancelBtn = document.getElementById("cancel-btn");
var questionContainer = document.querySelector(".question-container");
var questionNumber = document.getElementById("question-number");
var filled = false;
var questions = document.querySelectorAll('.question-wrapper');
var arrows = document.querySelectorAll('.arrow');

cancelBtn.addEventListener("click", function(){
    window.location.href = "/rwa/admin/home";
})

arrows.forEach((arrow) => {
    arrow.addEventListener("click", function(event){
        event.stopPropagation();
        var answers = this.previousElementSibling;
        if(answers.classList.contains("selected")){
            answers.classList.remove("selected");
            arrow.innerHTML = '<ion-icon name="chevron-down-outline"></ion-icon>';
        } else {
            answers.classList.add("selected");
            arrow.innerHTML = '<ion-icon name="chevron-up-outline"></ion-icon>';
        }
    });
});

quizName.addEventListener("input", function(e){
    cardName.textContent = e.target.value;
});
quizCategory.addEventListener("input", function(e){
    cardCategory.textContent = e.target.value;
});

createQuestion.addEventListener("click", function(){
    var question = document.createElement("div");
    question.classList.add("question-wrapper");
    question.classList.add("draggable");
    question.setAttribute("draggable", "true");
    question.innerHTML = `<div class="question">
        <input type="text" class="question-input" placeholder="Quiz question text">
        <button class="trash-button"><ion-icon class="trash" name="trash-outline"></ion-icon></button>
        </div> 
        <div class="answers-wrapper">
        <div class="answer">
        <input type="text" class="answer-input" placeholder="Question answer text">
        <input type="checkbox" class="correct">
        </div>
        <div class="answer">
        <input type="text" class="answer-input" placeholder="Question answer text">
        <input type="checkbox" class="correct">
        </div>
        <div class="answer">
        <input type="text" class="answer-input" placeholder="Question answer text">
        <input type="checkbox" class="correct">
        </div>
        <div class="answer">
        <input type="text" class="answer-input" placeholder="Question answer text">
        <input type="checkbox" class="correct">
        </div>
        </div>
        <div class="arrow">
        <ion-icon class="down-arrow" name="chevron-down-outline"></ion-icon>
        </div>`;
    questionContainer.appendChild(question);

    question.addEventListener("dragstart", function (event) {
        event.target.classList.add("dragging");
        event.dataTransfer.setData("text/plain", event.target.id);
    });

    question.addEventListener("dragend", function (event) {
        event.target.classList.remove("dragging");
        [...questionContainer.querySelectorAll('.question-wrapper')].forEach(el => {
            el.style.transform = 'none';
        });
    });

    questionContainer.addEventListener("dragover", function (event) {
        event.preventDefault();
        const afterElement = getDragAfterElement(event.clientY);
        const draggable = document.querySelector('.dragging');
        const questionElements = [...questionContainer.querySelectorAll('.question-wrapper:not(.dragging)')];
        questionElements.forEach((element, index) => {
            const box = element.getBoundingClientRect();
            const offset = event.clientY - box.top - box.height / 2;

            if (offset > 0) {
                element.style.transform = `translateY(${draggable.offsetHeight}px)`;
            } else {
                element.style.transform = `translateY(0)`;
            }
        });
        if (afterElement == null) {
            questionContainer.appendChild(draggable);
        } else {
            questionContainer.insertBefore(draggable, afterElement);
        }
    });

    function getDragAfterElement(y) {
        const draggableElements = [...questionContainer.querySelectorAll('.question-wrapper:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    questionNumber.textContent = questionContainer.childElementCount + " questions";

    question.querySelector('.question-input').addEventListener('input', updateBackground);

    question.querySelector(".trash-button").addEventListener("click", function(){
        question.classList.add('fade-out');

        setTimeout(() => {
            questionContainer.removeChild(question);
            questionNumber.textContent = questionContainer.childElementCount + " questions";
        }, 500);
    });

    var answerInputs = question.querySelectorAll('.answer-input');
    answerInputs.forEach(input => {
        input.addEventListener('input', updateBackground);
    });

    var checkboxes = question.querySelectorAll('.correct');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateBackground);
    });

    question.lastElementChild.addEventListener("click", function(event) {
        event.stopPropagation();
        var answers = this.previousElementSibling;
        if (answers.classList.contains("selected")) {
            answers.classList.remove("selected");
            this.innerHTML = '<ion-icon name="chevron-down-outline"></ion-icon>';
        } else {
            answers.classList.add("selected");
            this.innerHTML = '<ion-icon name="chevron-up-outline"></ion-icon>';
        }
    });

    function updateBackground() {
        filled = true;

        if (question.firstElementChild.firstElementChild.value === "") filled = false;

        var answers = question.querySelectorAll(".answer");
        answers.forEach((answer) => {
            if (answer.firstElementChild.value === "") filled = false;
        });

        var checkboxes = question.querySelectorAll('input[type="checkbox"]');
        if (![...checkboxes].some(checkbox => checkbox.checked)) filled = false;

        question.setAttribute("style", "background-color: " + (filled ? "var(--green)" : "var(--red)") + ";");

        return filled;
    }

    updateBackground();
});

createQuiz.addEventListener("click", function(){
    if(filled){
        let QUIZ = new Quiz(quizName.value, quizCategory.value, []);

        questions = questionContainer.querySelectorAll(".question-wrapper");

        for(let i = 0; i < questions.length; ++i){
            let answers = questions[i].querySelectorAll(".answer-input");
            let checkboxes = questions[i].querySelectorAll(".correct");
            QUIZ.addQuestion(new Question(60, 10,questions[i].firstElementChild.firstElementChild.value, []));
            for(let j = 0; j < 4; ++j){
                QUIZ.questions[i].addAnswer(new Answer(answers[j].value, checkboxes[j].checked ));
            }
        }
        let xhr = new XMLHttpRequest();
        let json = JSON.stringify(QUIZ);
        xhr.open("POST", "/rwa/admin/quizzes/create", true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function (){
            if(xhr.status !== 200){
                console.error(`Error ${xhr.status}: ${xhr.statusText}`);
            } else {
                window.location.href = "/rwa/admin/home";
            }
        }
        xhr.onerror = function (){
            console.error("Request failed");
        };
        xhr.send("quiz=" + json);
    } else {
        console.log("quiz not filled properly");
    }
})

function Quiz(title, category ,questions){
    this.title = title;
    this.category = category;
    this.questions = questions;
}

Quiz.prototype.addQuestion = function(question){
    this.questions.push(question);
}

function Question(seconds, points, question, answers){
    this.seconds = seconds;
    this.points = points;
    this.question = question;
    this.answers = answers;
}

Question.prototype.addAnswer = function(answer){
    this.answers.push(answer);
}

function Answer(answer_text, correct){
    this.answer_text = answer_text;
    this.correct = correct;
}

function User(id, username, isAdmin){
    this.id = id;
    this.username = username;
    this.isAdmin = isAdmin;
}



