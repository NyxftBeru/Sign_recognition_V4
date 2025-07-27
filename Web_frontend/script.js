// Quiz Data
const quizData = {
    sections: [
        {
            title: "Section 1: Basic Alphabet (Multiple Choice)",
            questions: [
                {
                    id: 1,
                    question: "What letter does this ASL sign represent?",
                    image: "🤟", // This would be an actual image in a real app
                    type: "multiple-choice",
                    options: ["A", "I", "L", "Y"],
                    correct: 3, // Y (I Love You sign)
                    explanation: "This is the 'I Love You' sign which combines I, L, and Y."
                },
                {
                    id: 2,
                    question: "Which ASL sign represents the letter 'B'?",
                    image: "✋", // Represents flat hand
                    type: "multiple-choice",
                    options: ["Flat hand with fingers together", "Closed fist", "Peace sign", "Pointing finger"],
                    correct: 0,
                    explanation: "Letter 'B' is signed with a flat hand, fingers together and extended upward."
                },
                {
                    id: 3,
                    question: "What letter is formed by making a 'C' shape with your hand?",
                    image: "🤏", // Represents C shape
                    type: "multiple-choice",
                    options: ["O", "C", "G", "U"],
                    correct: 1,
                    explanation: "The letter 'C' is formed by curving your fingers to make a 'C' shape."
                },
                {
                    id: 4,
                    question: "Which finger position represents the letter 'D'?",
                    image: "👆", // Represents pointing up
                    type: "multiple-choice",
                    options: ["Index finger up, others closed", "Two fingers up", "Three fingers up", "All fingers up"],
                    correct: 0,
                    explanation: "Letter 'D' is signed with the index finger pointing up and other fingers closed with thumb."
                }
            ]
        },
        {
            title: "Section 2: Numbers & Colors (True/False)",
            questions: [
                {
                    id: 5,
                    question: "The number '5' in ASL is signed with all five fingers extended.",
                    image: "🖐️", // Open hand
                    type: "true-false",
                    options: ["True", "False"],
                    correct: 0, // True
                    explanation: "Correct! Number '5' is signed with an open hand, all five fingers extended."
                },
                {
                    id: 6,
                    question: "The number '3' in ASL is signed by holding up your thumb, index, and middle finger.",
                    image: "🤟", // Three fingers (modified representation)
                    type: "true-false",
                    options: ["True", "False"],
                    correct: 0, // True
                    explanation: "True! The number '3' is signed with the thumb, index, and middle finger extended."
                },
                {
                    id: 7,
                    question: "The color 'BLUE' is signed by pointing to something blue in the room.",
                    image: "👋", // Represents shaking motion
                    type: "true-false",
                    options: ["True", "False"],
                    correct: 1, // False
                    explanation: "False! The color 'BLUE' is signed by making the letter 'B' and shaking it, not by pointing."
                },
                {
                    id: 8,
                    question: "All color signs in ASL are made by shaking the first letter of the color's name.",
                    image: "🔴", // Red circle
                    type: "true-false",
                    options: ["True", "False"],
                    correct: 1, // False
                    explanation: "False! While some colors like 'BLUE' use this pattern, others like 'RED' use twisting motions, and some colors have unique signs."
                }
            ]
        },
        {
            title: "Section 3: Common Words (Fill in the Blank)",
            questions: [
                {
                    id: 9,
                    question: "Complete the sign description: To sign 'HELLO', you _____ your hand.",
                    image: "👋", // Waving hand
                    type: "fill-blank",
                    options: ["wave", "shake", "point", "clap"],
                    correct: 0, // wave
                    explanation: "'HELLO' is signed by waving your hand, similar to a casual wave greeting."
                },
                {
                    id: 10,
                    question: "To sign 'THANK YOU', touch your _____ with a flat hand and move it forward.",
                    image: "🤔", // Thinking gesture
                    type: "fill-blank",
                    options: ["forehead", "chest", "chin", "nose"],
                    correct: 2, // chin
                    explanation: "'THANK YOU' is signed by touching your chin with a flat hand and moving it forward."
                },
                {
                    id: 11,
                    question: "The sign for 'PLEASE' involves making a _____ motion on your chest.",
                    image: "🤲", // Open hands
                    type: "fill-blank",
                    options: ["tapping", "circular", "up-down", "side-to-side"],
                    correct: 1, // circular
                    explanation: "'PLEASE' is signed by placing your flat hand on your chest and rubbing in a circular motion."
                },
                {
                    id: 12,
                    question: "To sign 'ME' or 'I', you _____ to yourself with your index finger.",
                    image: "👆", // Pointing
                    type: "fill-blank",
                    options: ["wave", "point", "gesture", "motion"],
                    correct: 1, // point
                    explanation: "Pointing to yourself with your index finger means 'ME' or 'I' in ASL."
                }
            ]
        }
    ]
};

// Quiz State
let currentQuestionIndex = 0;
let userAnswers = [];
let currentSectionIndex = 0;
let isQuizComplete = false;

// DOM Elements
const questionContainer = document.getElementById('questionContainer');
const sectionHeader = document.getElementById('sectionHeader');
const progressFill = document.getElementById('progressFill');
const currentQuestionSpan = document.getElementById('currentQuestion');
const totalQuestionsSpan = document.getElementById('totalQuestions');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const resultsContainer = document.getElementById('resultsContainer');
const reviewContainer = document.getElementById('reviewContainer');
const quizContainer = document.querySelector('.quiz-container');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const toggleIcon = document.getElementById('toggleIcon');
const body = document.body;

// Initialize Quiz
function initializeQuiz() {
    const totalQuestions = quizData.sections.reduce((total, section) => total + section.questions.length, 0);
    totalQuestionsSpan.textContent = totalQuestions;
    userAnswers = new Array(totalQuestions).fill(null);
    
    initializeSidebar();
    displayQuestion();
    updateProgress();
    updateNavigation();
    updateSidebar();
}

// Initialize Sidebar
function initializeSidebar() {
    const section1Nav = document.getElementById('section1Nav');
    const section2Nav = document.getElementById('section2Nav');
    const section3Nav = document.getElementById('section3Nav');
    
    // Create question buttons for each section
    for (let i = 1; i <= 4; i++) {
        // Section 1
        const btn1 = document.createElement('div');
        btn1.className = 'question-btn';
        btn1.textContent = `Q${i}`;
        btn1.dataset.questionIndex = i - 1;
        btn1.onclick = () => navigateToQuestion(i - 1);
        section1Nav.appendChild(btn1);
        
        // Section 2
        const btn2 = document.createElement('div');
        btn2.className = 'question-btn';
        btn2.textContent = `Q${i + 4}`;
        btn2.dataset.questionIndex = i + 3;
        btn2.onclick = () => navigateToQuestion(i + 3);
        section2Nav.appendChild(btn2);
        
        // Section 3
        const btn3 = document.createElement('div');
        btn3.className = 'question-btn';
        btn3.textContent = `Q${i + 8}`;
        btn3.dataset.questionIndex = i + 7;
        btn3.onclick = () => navigateToQuestion(i + 7);
        section3Nav.appendChild(btn3);
    }
}

// Navigate to specific question
function navigateToQuestion(questionIndex) {
    currentQuestionIndex = questionIndex;
    displayQuestion();
    updateProgress();
    updateNavigation();
    updateSidebar();
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Update Sidebar
function updateSidebar() {
    const questionBtns = document.querySelectorAll('.question-btn');
    
    questionBtns.forEach((btn, index) => {
        btn.classList.remove('current', 'answered');
        
        // Mark current question
        if (index === currentQuestionIndex) {
            btn.classList.add('current');
        }
        
        // Mark answered questions
        if (userAnswers[index] !== null) {
            btn.classList.add('answered');
        }
    });
}

// Toggle Sidebar (mobile and desktop)
function toggleSidebar() {
    if (window.innerWidth <= 768) {
        // Mobile behavior - slide in/out
        sidebar.classList.toggle('open');
    } else {
        // Desktop behavior - collapse/expand
        sidebar.classList.toggle('collapsed');
        body.classList.toggle('sidebar-collapsed');
        
        // Update toggle icon
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.textContent = '▶';
        } else {
            toggleIcon.textContent = '◀';
        }
    }
}

// Close sidebar when clicking outside on mobile
function handleOutsideClick(event) {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    }
}

// Handle window resize
function handleWindowResize() {
    if (window.innerWidth > 768) {
        // Remove mobile classes when switching to desktop
        sidebar.classList.remove('open');
        // Reset toggle icon for desktop
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.textContent = '▶';
        } else {
            toggleIcon.textContent = '◀';
        }
    } else {
        // Remove desktop classes when switching to mobile
        sidebar.classList.remove('collapsed');
        body.classList.remove('sidebar-collapsed');
        toggleIcon.textContent = '≡';
    }
}

// Display Current Question
function displayQuestion() {
    const allQuestions = getAllQuestions();
    const question = allQuestions[currentQuestionIndex];
    const section = getCurrentSection();
    
    // Update section header
    sectionHeader.innerHTML = `<h2>${section.title}</h2>`;
    
    // Create question HTML based on type
    let questionHTML = `
        <div class="question">
            <div class="question-number">Question ${currentQuestionIndex + 1}</div>
            <div class="question-text">${question.question}</div>
            <div class="question-image">
                <div class="sign-image">${question.image}</div>
            </div>
    `;
    
    // Generate options based on question type
    if (question.type === 'multiple-choice') {
        questionHTML += `
            <div class="options">
                ${question.options.map((option, index) => `
                    <div class="option" data-index="${index}" onclick="selectOption(${index})">
                        ${option}
                    </div>
                `).join('')}
            </div>
        `;
    } else if (question.type === 'true-false') {
        questionHTML += `
            <div class="options true-false">
                ${question.options.map((option, index) => `
                    <div class="option tf-option" data-index="${index}" onclick="selectOption(${index})">
                        <span class="tf-icon">${index === 0 ? '✓' : '✗'}</span>
                        <span class="tf-text">${option}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (question.type === 'fill-blank') {
        questionHTML += `
            <div class="options fill-blank">
                ${question.options.map((option, index) => `
                    <div class="option fb-option" data-index="${index}" onclick="selectOption(${index})">
                        ${option}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    questionHTML += `</div>`;
    
    questionContainer.innerHTML = questionHTML;
    
    // Restore previous answer if exists
    if (userAnswers[currentQuestionIndex] !== null) {
        const selectedOption = document.querySelector(`[data-index="${userAnswers[currentQuestionIndex]}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }
}

// Get all questions in order
function getAllQuestions() {
    return quizData.sections.flatMap(section => section.questions);
}

// Get current section
function getCurrentSection() {
    let questionCount = 0;
    for (let section of quizData.sections) {
        if (currentQuestionIndex < questionCount + section.questions.length) {
            return section;
        }
        questionCount += section.questions.length;
    }
    return quizData.sections[0];
}

// Select Answer Option
function selectOption(optionIndex) {
    // Remove previous selection
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selection to clicked option
    const selectedOption = document.querySelector(`[data-index="${optionIndex}"]`);
    selectedOption.classList.add('selected');
    
    // Store answer
    userAnswers[currentQuestionIndex] = optionIndex;
    
    // Update navigation and sidebar
    updateNavigation();
    updateSidebar();
}

// Update Progress Bar
function updateProgress() {
    const totalQuestions = getAllQuestions().length;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    progressFill.style.width = `${progress}%`;
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
}

// Update Navigation Buttons
function updateNavigation() {
    const totalQuestions = getAllQuestions().length;
    const hasAnswer = userAnswers[currentQuestionIndex] !== null;
    
    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // Next/Submit button
    if (currentQuestionIndex === totalQuestions - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = hasAnswer ? 'inline-block' : 'none';
    } else {
        nextBtn.style.display = hasAnswer ? 'inline-block' : 'none';
        submitBtn.style.display = 'none';
        nextBtn.disabled = !hasAnswer;
    }
}

// Navigation Functions
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateProgress();
        updateNavigation();
        updateSidebar();
    }
}

function nextQuestion() {
    const totalQuestions = getAllQuestions().length;
    if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateProgress();
        updateNavigation();
        updateSidebar();
    }
}

// Submit Quiz
function submitQuiz() {
    isQuizComplete = true;
    calculateResults();
    showResults();
}

// Calculate Results
function calculateResults() {
    const allQuestions = getAllQuestions();
    let totalCorrect = 0;
    let sectionScores = [0, 0, 0]; // Scores for each section
    let sectionTotals = [4, 4, 4]; // Total questions per section
    
    allQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        
        if (isCorrect) {
            totalCorrect++;
            
            // Update section score
            const sectionIndex = Math.floor(index / 4);
            sectionScores[sectionIndex]++;
        }
    });
    
    // Update score displays
    const percentage = Math.round((totalCorrect / allQuestions.length) * 100);
    document.getElementById('scorePercentage').textContent = `${percentage}%`;
    document.getElementById('scoreText').textContent = `${totalCorrect} out of ${allQuestions.length}`;
    
    // Update section breakdowns
    document.getElementById('section1Score').textContent = `${sectionScores[0]}/${sectionTotals[0]}`;
    document.getElementById('section2Score').textContent = `${sectionScores[1]}/${sectionTotals[1]}`;
    document.getElementById('section3Score').textContent = `${sectionScores[2]}/${sectionTotals[2]}`;
}

// Show Results
function showResults() {
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    reviewContainer.style.display = 'none';
}

// Show Review
function showReview() {
    const allQuestions = getAllQuestions();
    let reviewHTML = '';
    
    allQuestions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct;
        const userAnswerText = question.options[userAnswer] || 'No answer';
        const correctAnswerText = question.options[question.correct];
        
        reviewHTML += `
            <div class="review-item">
                <div class="review-question">Question ${index + 1}: ${question.question}</div>
                <div class="review-answer user-answer">Your answer: ${userAnswerText}</div>
                <div class="review-answer correct">Correct answer: ${correctAnswerText}</div>
                <div class="review-answer ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </div>
                <div style="margin-top: 10px; color: #666; font-style: italic;">
                    ${question.explanation}
                </div>
            </div>
        `;
    });
    
    document.getElementById('reviewContent').innerHTML = reviewHTML;
    
    resultsContainer.style.display = 'none';
    reviewContainer.style.display = 'block';
}

// Retake Quiz
function retakeQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(getAllQuestions().length).fill(null);
    isQuizComplete = false;
    
    resultsContainer.style.display = 'none';
    reviewContainer.style.display = 'none';
    quizContainer.style.display = 'flex';
    
    displayQuestion();
    updateProgress();
    updateNavigation();
    updateSidebar();
}

// Back to Results
function backToResults() {
    reviewContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
}

// Event Listeners
prevBtn.addEventListener('click', previousQuestion);
nextBtn.addEventListener('click', nextQuestion);
submitBtn.addEventListener('click', submitQuiz);
document.getElementById('retakeBtn').addEventListener('click', retakeQuiz);
document.getElementById('reviewBtn').addEventListener('click', showReview);
document.getElementById('backToResultsBtn').addEventListener('click', backToResults);
sidebarToggle.addEventListener('click', toggleSidebar);
document.addEventListener('click', handleOutsideClick);
window.addEventListener('resize', handleWindowResize);

// Initialize the quiz when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeQuiz();
    handleWindowResize(); // Set initial state based on screen size
});
