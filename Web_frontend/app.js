// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAGZ7rVYkdi3v4NPZuPQxpFN0PBU561kA",
    authDomain: "c300-8be63.firebaseapp.com",
    projectId: "c300-8be63",
    storageBucket: "c300-8be63.firebasestorage.app",
    messagingSenderId: "209053023145",
    appId: "1:209053023145:web:d565dfc17b478e2f6222b8",
    measurementId: "G-K17THG0XGW"
};

// OpenAI configuration
const OPENAI_API_KEY = "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";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Quiz application class
class SignLanguageQuiz {
    constructor() {
        this.signs = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.questionOptions = []; // Store options for each question
        this.isQuizSubmitted = false;
        this.currentReviewIndex = 0; // For review mode navigation
        this.isInReviewMode = false; // Track if we're in review mode
        this.isInResultsSummary = false; // Track if we're viewing results summary
        this.aiSentence = null; // Store generated sentence for Q6
        this.chatSkipAnimations = false; // Track if user wants to skip chat animations
        
        // Optimization: Cache for API responses and Firestore data
        this.openaiCache = this.loadOpenAICache();
        this.firestoreCache = this.loadFirestoreCache();
        this.isDataLoaded = false; // Track if initial data load is complete
        
        // Set OpenAI API key
        this.openaiApiKey = OPENAI_API_KEY;
        
        // OpenAI API is enabled by default
        this.openaiDisabled = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadQuizData();
    }

    initializeElements() {
        this.loadingElement = document.getElementById('loading');
        this.quizContainer = document.getElementById('quiz-container');
        this.resultsContainer = document.getElementById('results-container');
        this.questionCounterElement = document.getElementById('question-counter');
        this.signVideo = document.getElementById('sign-video');
        this.optionsContainer = document.getElementById('options-container');
        this.replayBtn = document.getElementById('replay-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.submitBtn = document.getElementById('submit-btn');
        this.finalScoreElement = document.getElementById('final-score');
        this.resultsDetailsElement = document.getElementById('results-details');
        this.restartBtn = document.getElementById('restart-btn');
        this.restartBtnReview = document.getElementById('restart-btn-review');
        
        // Progress bar elements
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');
        
        // Review mode elements
        this.reviewModeBtn = document.getElementById('review-mode-btn');
        this.summaryModeBtn = document.getElementById('summary-mode-btn');
        this.resultsSummary = document.getElementById('results-summary');
        this.reviewMode = document.getElementById('review-mode');
        this.reviewQuestionTitle = document.getElementById('review-question-title');
        this.reviewStatus = document.getElementById('review-status');
        this.reviewVideo = document.getElementById('review-video');
        this.reviewVideoContainer = document.querySelector('.review-video-container');
        this.reviewUserAnswer = document.getElementById('review-user-answer');
        this.reviewCorrectAnswer = document.getElementById('review-correct-answer');
        this.reviewPrevBtn = document.getElementById('review-prev-btn');
        this.reviewNextBtn = document.getElementById('review-next-btn');
        this.reviewQuestionCounter = document.getElementById('review-question-counter');
        
        // Chat elements
        this.chatSkipBtn = document.getElementById('chat-skip-btn');
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.questionListSection1 = document.getElementById('question-list-section1');
        this.questionListSection2 = document.getElementById('question-list-section2');
        this.questionListSection3 = document.getElementById('question-list-section3');
        this.container = document.querySelector('.container');
    }

    bindEvents() {
        this.replayBtn.addEventListener('click', () => this.replayVideo());
        this.nextBtn.addEventListener('click', () => this.nextQuestion());
        this.submitBtn.addEventListener('click', () => this.submitQuiz());
        this.restartBtn.addEventListener('click', () => this.restartQuiz());
        this.restartBtnReview.addEventListener('click', () => this.restartQuiz());
        
        // Review mode events
        this.reviewModeBtn.addEventListener('click', () => this.enterReviewMode());
        this.summaryModeBtn.addEventListener('click', () => this.exitReviewMode());
        this.reviewPrevBtn.addEventListener('click', () => this.reviewPreviousQuestion());
        this.reviewNextBtn.addEventListener('click', () => this.reviewNextQuestion());
        
        // Chat skip button event
        this.chatSkipBtn.addEventListener('click', () => this.skipChatAnimations());
        
        // Sidebar events
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!this.sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle')) {
                    this.sidebar.classList.remove('open');
                }
            }
        });
    }

    // Cache Management Methods
    loadOpenAICache() {
        try {
            const cached = localStorage.getItem('signQuiz_openaiCache');
            return cached ? JSON.parse(cached) : {};
        } catch (error) {
            console.warn('Failed to load OpenAI cache:', error);
            return {};
        }
    }

    saveOpenAICache() {
        try {
            localStorage.setItem('signQuiz_openaiCache', JSON.stringify(this.openaiCache));
        } catch (error) {
            console.warn('Failed to save OpenAI cache:', error);
        }
    }

    loadFirestoreCache() {
        try {
            const cached = localStorage.getItem('signQuiz_firestoreCache');
            const data = cached ? JSON.parse(cached) : null;
            
            // Check if cache is still valid (24 hours)
            if (data && data.timestamp && (Date.now() - data.timestamp < 24 * 60 * 60 * 1000)) {
                return data.signs;
            }
            return null;
        } catch (error) {
            console.warn('Failed to load Firestore cache:', error);
            return null;
        }
    }

    saveFirestoreCache(signs) {
        try {
            const cacheData = {
                signs: signs,
                timestamp: Date.now()
            };
            localStorage.setItem('signQuiz_firestoreCache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save Firestore cache:', error);
            if (error.name === 'QuotaExceededError') {
                console.log('🧹 Clearing old cache to free up space...');
                try {
                    // Clear old cache and try again
                    localStorage.removeItem('signQuiz_firestoreCache');
                    localStorage.setItem('signQuiz_firestoreCache', JSON.stringify({
                        signs: signs,
                        timestamp: Date.now()
                    }));
                    console.log('✅ Cache saved after cleanup');
                } catch (retryError) {
                    console.warn('❌ Still cannot save cache after cleanup:', retryError);
                }
            }
        }
    }

    // Cache clearing methods (useful for debugging or forcing refresh)
    clearAllCache() {
        try {
            localStorage.removeItem('signQuiz_openaiCache');
            localStorage.removeItem('signQuiz_firestoreCache');
            this.openaiCache = {};
            this.firestoreCache = null;
            console.log('All cache cleared');
        } catch (error) {
            console.warn('Failed to clear cache:', error);
        }
    }

    clearOpenAICache() {
        try {
            localStorage.removeItem('signQuiz_openaiCache');
            this.openaiCache = {};
            console.log('OpenAI cache cleared');
        } catch (error) {
            console.warn('Failed to clear OpenAI cache:', error);
        }
    }

    async loadQuizData() {
        try {
            console.log('Loading quiz data...');
            
            // Try to use cached Firestore data first
            if (this.firestoreCache && this.firestoreCache.length > 0) {
                console.log('Using cached Firestore data');
                this.signs = [...this.firestoreCache];
                this.isDataLoaded = true;
            } else {
                console.log('Loading fresh data from Firestore...');
                const signsCollection = await db.collection('signs').get();
                
                if (signsCollection.empty) {
                    throw new Error('No signs found in the collection');
                }

                this.signs = [];
                signsCollection.forEach(doc => {
                    const data = doc.data();
                    if (data.base64) {
                        this.signs.push({
                            id: doc.id,
                            name: doc.id,
                            base64: data.base64
                        });
                    }
                });

                console.log(`Loaded ${this.signs.length} signs from Firestore`);

                if (this.signs.length === 0) {
                    throw new Error('No valid signs with base64 data found');
                }

                // Cache the loaded data
                this.saveFirestoreCache(this.signs);
                this.isDataLoaded = true;
            }

            // Shuffle the signs for random order
            this.shuffleArray(this.signs);
            
            this.hideLoading();
            this.generateSidebar();
            this.startQuiz();
        } catch (error) {
            console.error('Error loading quiz data:', error);
            this.showError('Failed to load quiz data. Please check your internet connection and try again.');
        }
    }

    generateSidebar() {
        this.questionListSection1.innerHTML = '';
        this.questionListSection2.innerHTML = '';
        this.questionListSection3.innerHTML = '';
        
        this.signs.forEach((sign, index) => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <span class="question-number">${index + 1}</span>
            `;
            
            questionItem.addEventListener('click', () => this.navigateToQuestion(index));
            
            // Add to appropriate section (first 5 in section 1, next 5 in section 2, rest in section 3)
            if (index < 5) {
                this.questionListSection1.appendChild(questionItem);
            } else if (index < 10) {
                this.questionListSection2.appendChild(questionItem);
            } else {
                this.questionListSection3.appendChild(questionItem);
            }
        });
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebar.classList.toggle('open');
        } else {
            this.sidebar.classList.toggle('collapsed');
            this.container.classList.toggle('sidebar-collapsed');
        }
    }

    navigateToQuestion(index) {
        if (index >= 0 && index < this.signs.length) {
            // Prevent navigation when viewing results summary
            if (this.isInResultsSummary) {
                return; // Do nothing when on results summary page
            }
            
            if (this.isInReviewMode) {
                // Navigate in review mode
                this.currentReviewIndex = index;
                this.displayReviewQuestion();
            } else {
                // Navigate in quiz mode
                this.currentQuestionIndex = index;
                this.displayQuestion();
            }
            this.updateSidebarHighlight();
            
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                this.sidebar.classList.remove('open');
            }
        }
    }

    updateSidebarHighlight() {
        // Get question items from all sections
        const section1Items = this.questionListSection1.querySelectorAll('.question-item');
        const section2Items = this.questionListSection2.querySelectorAll('.question-item');
        const section3Items = this.questionListSection3.querySelectorAll('.question-item');
        const allQuestionItems = [...section1Items, ...section2Items, ...section3Items];
        
        // Determine which index to highlight based on mode
        const currentIndex = this.isInReviewMode ? this.currentReviewIndex : this.currentQuestionIndex;
        
        allQuestionItems.forEach((item, index) => {
            item.classList.remove('current', 'answered', 'incorrect');
            
            // Don't show current question when viewing results summary
            if (!this.isInResultsSummary && index === currentIndex) {
                item.classList.add('current');
            } else {
                const userAnswer = this.userAnswers[index];
                if (userAnswer) {
                    item.classList.add('answered');
                    // Only show correct/incorrect after quiz is submitted
                    if (this.isQuizSubmitted && userAnswer.isCorrect === false) {
                        item.classList.add('incorrect');
                    }
                }
            }
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    hideLoading() {
        this.loadingElement.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
    }

    showError(message) {
        this.loadingElement.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    startQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = new Array(this.signs.length).fill(null);
        this.isQuizSubmitted = false;
        this.isInReviewMode = false; // Reset review mode
        this.isInResultsSummary = false; // Reset results summary mode
        this.aiSentence = null;
        
        // Generate consistent options for all questions
        this.generateAllQuestionOptions();
        
        // Reset question text
        this.resetQuestionText();
        
        this.updateUI();
        this.updateProgressBar(); // Initialize progress bar
        this.displayQuestion();
        this.updateSidebarHighlight();
    }

    generateAllQuestionOptions() {
        this.questionOptions = [];
        
        this.signs.forEach(correctSign => {
            const options = [correctSign];
            const availableSigns = this.signs.filter(sign => sign.id !== correctSign.id);
            
            // Add 3 random wrong options
            const wrongOptions = [...availableSigns];
            this.shuffleArray(wrongOptions);
            
            for (let i = 0; i < 3 && i < wrongOptions.length; i++) {
                options.push(wrongOptions[i]);
            }
            
            // Shuffle options for this question
            this.shuffleArray(options);
            this.questionOptions.push(options);
        });
    }

    async batchGenerateSentencesForSection2() {
        try {
            // Get words for Questions 6-10 (indices 5-9)
            const section2Words = this.signs.slice(5, 10).map(sign => sign.name);
            
            // Check if we already have ALL sentences cached
            const missingWords = section2Words.filter(word => !this.openaiCache[word]);
            
            if (missingWords.length === 0) {
                console.log('✅ All Section 2 sentences already cached!');
                return true;
            }
            
            console.log(`🔄 Generating sentences for ${missingWords.length} words in batch:`, missingWords);
            
            // Ultra-efficient: Generate ALL missing sentences in ONE API call
            const batchPrompt = `Create simple, educational sentences for sign language learning. For each word provided, create ONE sentence using that word. The sentences should be practical and suitable for fill-in-the-blank exercises.

Words: ${missingWords.join(', ')}

Format your response as:
1. [word1]: [sentence with word1]
2. [word2]: [sentence with word2]
etc.

Example format:
1. practice: I need to practice my skills every day.
2. explain: Please explain the concept to me.`;

            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "You are an educational assistant. Create simple, clear sentences for sign language learning. Follow the exact format requested."
                        },
                        {
                            role: "user",
                            content: batchPrompt
                        }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const batchResponse = data.choices[0].message.content.trim();
            
            // Parse the batch response and cache each sentence
            const lines = batchResponse.split('\n');
            lines.forEach(line => {
                const match = line.match(/^\d+\.\s*([^:]+):\s*(.+)$/);
                if (match) {
                    const word = match[1].trim().toLowerCase();
                    const sentence = match[2].trim();
                    
                    // Cache the sentence
                    this.openaiCache[word] = sentence;
                    console.log(`💾 Cached sentence for "${word}": ${sentence}`);
                }
            });
            
            // Save the updated cache
            this.saveOpenAICache();
            console.log(`✅ Batch generated and cached sentences for ${missingWords.length} words`);
            return true;
            
        } catch (error) {
            console.error('❌ Error in batch sentence generation:', error);
            return false;
        }
    }

    async generateSentenceWithOpenAI(word) {
        try {
            // Check cache first
            if (this.openaiCache[word]) {
                console.log(`Using cached sentence for word: ${word}`);
                return this.openaiCache[word];
            }

            const prompt = `Create a simple, clear sentence using the word "${word}". The sentence should be educational and suitable for sign language learning. Make it practical and easy to understand. Return only the sentence, nothing else.`;
            
            console.log('Sending request to OpenAI API for word:', word);
            console.log('API URL:', OPENAI_API_URL);
            
            const response = await fetch(OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: "You are an educational assistant helping create sentences for sign language learning. Respond with only the requested sentence, no additional text."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    max_tokens: 50,
                    temperature: 0.7
                })
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('HTTP error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('Full API response:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const generatedText = data.choices[0].message.content.trim();
                console.log('Generated sentence:', generatedText);
                
                // Cache the result
                this.openaiCache[word] = generatedText;
                this.saveOpenAICache();
                
                return generatedText;
            } else {
                console.error('Invalid response format:', data);
                throw new Error('Invalid response format from OpenAI API');
            }
        } catch (error) {
            console.error('Error generating sentence with OpenAI:', error);
            throw error; // Re-throw to handle in calling function
        }
    }

    async evaluateSection3Answers() {
        console.log('🔍 Evaluating Section 3 answers with OpenAI...');
        
        // Get Section 3 answers that need evaluation
        const section3Answers = this.userAnswers.slice(10).filter(answer => 
            answer && answer.userAnswer && answer.userAnswer.trim().length > 0);
        
        if (section3Answers.length === 0) {
            console.log('No Section 3 answers to evaluate');
            return;
        }
        
        // Batch evaluate all Section 3 answers in one API call for efficiency
        try {
            const evaluations = await this.batchEvaluateSection3(section3Answers);
            
            // Apply evaluations to answers
            section3Answers.forEach((answer, index) => {
                if (evaluations[index]) {
                    answer.evaluation = evaluations[index].feedback;
                    answer.score = evaluations[index].score;
                    answer.isCorrect = evaluations[index].score >= 7; // 7/10 or higher is "correct"
                    
                    // Add to score if correct
                    if (answer.isCorrect) {
                        this.score++;
                    }
                }
            });
            
            console.log('✅ Section 3 evaluation completed');
            
        } catch (error) {
            console.error('❌ Failed to evaluate Section 3:', error);
            
            // Provide fallback scoring for Section 3 when OpenAI fails
            console.log('🔄 Using fallback evaluation for Section 3...');
            section3Answers.forEach((answer, index) => {
                // Simple fallback: give credit if they provided a reasonable answer
                const answerLength = answer.userAnswer ? answer.userAnswer.trim().length : 0;
                const hasValidAnswer = answerLength >= 10; // At least 10 characters
                
                answer.evaluation = hasValidAnswer 
                    ? "Your answer was submitted successfully. Due to technical limitations, detailed AI evaluation is currently unavailable." 
                    : "Please provide a more detailed description of the sign gesture.";
                answer.score = hasValidAnswer ? 7 : 3; // Give benefit of doubt for valid attempts
                answer.isCorrect = hasValidAnswer;
                
                // Add to score if correct
                if (answer.isCorrect) {
                    this.score++;
                }
            });
            
            console.log('✅ Section 3 fallback evaluation completed');
        }
    }

    async batchEvaluateSection3(answers) {
        // Create cache key for this batch of answers
        const cacheKey = 'section3_evaluation_' + JSON.stringify(answers.map(a => ({
            word: a.question,
            answer: a.userAnswer.trim()
        })));
        
        // Check cache first
        if (this.openaiCache[cacheKey]) {
            console.log('📋 Using cached Section 3 evaluation');
            return this.openaiCache[cacheKey];
        }
        
        console.log('🔄 Generating fresh Section 3 evaluation...');
        
        // Prepare evaluation prompt
        const evaluationPrompt = this.createSection3EvaluationPrompt(answers);
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert sign language instructor evaluating student descriptions of sign gestures. Provide constructive feedback and a score (1-10) for each answer.'
                        },
                        {
                            role: 'user',
                            content: evaluationPrompt
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ OpenAI API Error Details for Section 3:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorBody: errorText,
                    apiKeyFormat: this.openaiApiKey ? `${this.openaiApiKey.substring(0, 7)}...${this.openaiApiKey.substring(this.openaiApiKey.length - 4)}` : 'undefined'
                });
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const evaluationText = data.choices[0].message.content.trim();
            
            // Parse the evaluation response
            const evaluations = this.parseSection3Evaluation(evaluationText, answers.length);
            
            // Cache the result
            this.openaiCache[cacheKey] = evaluations;
            this.saveOpenAICache();
            
            console.log('💾 Cached Section 3 evaluation');
            return evaluations;
            
        } catch (error) {
            console.error('❌ Error in Section 3 batch evaluation:', error);
            throw error;
        }
    }

    createSection3EvaluationPrompt(answers) {
        let prompt = "Please evaluate these sign language gesture descriptions. For each answer, provide:\n";
        prompt += "1. A score from 1-10 (where 7+ is considered good)\n";
        prompt += "2. Brief constructive feedback\n\n";
        prompt += "Format your response as:\n";
        prompt += "ANSWER 1: Score: X/10 | Feedback: [your feedback]\n";
        prompt += "ANSWER 2: Score: X/10 | Feedback: [your feedback]\n";
        prompt += "etc.\n\n";
        
        answers.forEach((answer, index) => {
            prompt += `QUESTION ${index + 1}: Describe how to perform the "${answer.question}" sign\n`;
            prompt += `STUDENT ANSWER: ${answer.userAnswer}\n\n`;
        });
        
        return prompt;
    }

    parseSection3Evaluation(evaluationText, expectedCount) {
        const evaluations = [];
        const lines = evaluationText.split('\n');
        
        for (let i = 0; i < expectedCount; i++) {
            const pattern = new RegExp(`ANSWER ${i + 1}:\\s*Score:\\s*(\\d+)/10\\s*\\|\\s*Feedback:\\s*(.+)`, 'i');
            
            let found = false;
            for (const line of lines) {
                const match = line.match(pattern);
                if (match) {
                    evaluations.push({
                        score: parseInt(match[1]),
                        feedback: match[2].trim()
                    });
                    found = true;
                    break;
                }
            }
            
            // Fallback if parsing fails
            if (!found) {
                evaluations.push({
                    score: 5,
                    feedback: "Unable to parse evaluation. Please review manually."
                });
            }
        }
        
        return evaluations;
    }

    showEvaluationLoading() {
        const loadingElement = document.createElement('div');
        loadingElement.id = 'evaluation-loading';
        loadingElement.className = 'evaluation-loading';
        loadingElement.innerHTML = `
            <div class="evaluation-spinner"></div>
            <p>Evaluating your Section 3 answers...</p>
            <small>This may take a moment</small>
        `;
        
        // Add to main container
        const main = document.querySelector('main');
        main.appendChild(loadingElement);
        
        // Hide after evaluation is complete
        setTimeout(() => {
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.remove();
            }
        }, 10000); // Remove after 10 seconds max
    }

    async displayQuestion() {
        const currentSign = this.signs[this.currentQuestionIndex];
        
        // Set video source
        this.signVideo.src = `data:video/mp4;base64,${currentSign.base64}`;
        
        // Use pre-generated options for this question (except Section 3)
        if (this.currentQuestionIndex < 10) {
            const options = this.questionOptions[this.currentQuestionIndex];
            this.displayOptions(options);
        } else {
            // Section 3 - no multiple choice options, just display text input
            this.displayOptions([]);
        }
        
        // Hide/show main video based on question type
        const videoContainer = document.querySelector('.video-container');
        const quizContainer = document.querySelector('.quiz-container');
        if (this.currentQuestionIndex >= 10) {
            // Questions 11-15 (Section 3) - hide main video and show text input for describing steps
            videoContainer.style.display = 'none';
            quizContainer.classList.add('center-content');
            this.updateQuestionForSection3(currentSign.name, this.currentQuestionIndex + 1);
        } else if (this.currentQuestionIndex >= 5) {
            // Questions 6-10 (Section 2) - hide main video and update question text
            videoContainer.style.display = 'none';
            quizContainer.classList.add('center-content');
            if (this.openaiDisabled) {
                this.updateQuestionForSection2Fallback(currentSign.name, this.currentQuestionIndex + 1);
            } else {
                this.updateQuestionForOpenAI(currentSign.name);
            }
        } else {
            // Questions 1-5 (Section 1) - show main video and reset question text
            videoContainer.style.display = 'block';
            quizContainer.classList.remove('center-content');
            this.resetQuestionText();
        }
        
        // Update UI
        this.updateUI();
        this.updateSidebarHighlight();
        this.updateButtonVisibility();
        
        // Auto-play video for non-question-6
        if (this.currentQuestionIndex !== 5) {
            this.signVideo.play().catch(error => {
                console.log('Auto-play failed:', error);
            });
        }
    }

    async showOpenAISentence(word) {
        // Create or get the sentence container
        let sentenceContainer = document.getElementById('ai-sentence-container');
        if (!sentenceContainer) {
            sentenceContainer = document.createElement('div');
            sentenceContainer.id = 'ai-sentence-container';
            sentenceContainer.className = 'ai-sentence-container';
            
            // Insert after video container
            const videoContainer = document.querySelector('.video-container');
            videoContainer.parentNode.insertBefore(sentenceContainer, videoContainer.nextSibling);
        }
        
        // Show loading state
        sentenceContainer.innerHTML = `
            <div class="sentence-header">
                <h3>📝 Example Sentence for Question 6</h3>
            </div>
            <div class="sentence-content loading-sentence">
                <div class="sentence-spinner"></div>
                <p>Generating example sentence...</p>
            </div>
        `;
        sentenceContainer.style.display = 'block';
        
        try {
            // Generate sentence with OpenAI
            const sentence = await this.generateSentenceWithOpenAI(word);
            this.aiSentence = sentence;
            
            // Blank out the word to avoid revealing the answer
            const blankedSentence = this.blankOutWord(sentence, word);
            
            // Update with generated sentence
            sentenceContainer.innerHTML = `
                <div class="sentence-header">
                    <h3>📝 Example Sentence for Question 6</h3>
                </div>
                <div class="sentence-content">
                    <p class="generated-sentence">"${blankedSentence}"</p>
                    <small class="sentence-note">Generated with AI to help you understand the word in context</small>
                </div>
            `;
        } catch (error) {
            // Show error message instead of fallback
            sentenceContainer.innerHTML = `
                <div class="sentence-header">
                    <h3>❌ AI Sentence Generation Failed</h3>
                </div>
                <div class="sentence-content">
                    <p class="error-sentence">Unable to generate sentence for "${word}"</p>
                    <small class="sentence-note">Please check the console for detailed error information</small>
                </div>
            `;
            console.error('Failed to generate sentence for word:', word, error);
        }
    }
    
    blankOutWord(sentence, word) {
        // Create a case-insensitive regex to find the word and its variations
        const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
        
        // Replace the word with blanks (underscores) based on word length
        const blanks = '_'.repeat(word.length);
        
        return sentence.replace(wordRegex, blanks);
    }

    updateQuestionForQ6Fallback(word) {
        const questionElement = document.querySelector('.question-section h2');
        
        // Simple fallback question without API calls
        questionElement.innerHTML = `
            <div class="api-disabled-message">
                <p><strong>Question 6: Fill in the Blank</strong></p>
                <p>Complete this sentence with the correct sign word:</p>
                <p style="font-size: 1.2em; margin: 15px 0; font-style: italic;">
                    "I need to practice my _______ skills every day."
                </p>
                <p style="font-size: 0.9em; color: #ccc; margin-top: 10px;">
                    (AI generation temporarily disabled to save usage)
                </p>
            </div>
        `;
    }

    updateQuestionForSection2Fallback(word, questionNumber) {
        const questionElement = document.querySelector('.question-section h2');
        
        // Predefined fallback sentences for Questions 6-10
        const fallbackSentences = {
            6: "I need to practice my _______ skills every day.",
            7: "Please _______ to me what you mean.",
            8: "The weather is very _______ today.",
            9: "I feel _______ when I understand sign language.",
            10: "Can you _______ me the correct way to sign this?"
        };
        
        const sentence = fallbackSentences[questionNumber] || `The word _______ is important to learn.`;
        
        questionElement.innerHTML = `
            <div class="api-disabled-message">
                <p><strong>Question ${questionNumber}: Fill in the Blank</strong></p>
                <p>Complete this sentence with the correct sign word:</p>
                <p style="font-size: 1.2em; margin: 15px 0; font-style: italic;">
                    "${sentence}"
                </p>
                <p style="font-size: 0.9em; color: #ccc; margin-top: 10px;">
                    (AI generation temporarily disabled to save usage)
                </p>
            </div>
        `;
    }

    updateQuestionForSection3(word, questionNumber) {
        const questionElement = document.querySelector('.question-section h2');
        
        questionElement.innerHTML = `
            <div class="section3-question">
                <p><strong>Question ${questionNumber}: Describe the Sign</strong></p>
                <p>You have been given the sign word: <strong>"${word}"</strong></p>
                <p>Describe the steps to perform this sign's gesture:</p>
            </div>
        `;
    }

    async updateQuestionForOpenAI(word) {
        const questionElement = document.querySelector('.question-section h2');
        
        // Show loading state
        questionElement.innerHTML = `
            <div class="ai-question-loading">
                <div class="sentence-spinner"></div>
                <span>Generating question...</span>
            </div>
        `;
        
        try {
            // Try batch generation first for Section 2 (Q6-10) if not all cached
            if (this.currentQuestionIndex >= 5 && this.currentQuestionIndex <= 9) {
                const batchSuccess = await this.batchGenerateSentencesForSection2();
                if (!batchSuccess) {
                    console.log('🔄 Batch failed, falling back to individual generation');
                }
            }
            
            // Generate sentence with OpenAI (will use cache if available)
            const sentence = await this.generateSentenceWithOpenAI(word);
            this.aiSentence = sentence;
            
            // Blank out the word to avoid revealing the answer
            const blankedSentence = this.blankOutWord(sentence, word);
            
            // Update question with the blanked sentence
            questionElement.innerHTML = `Fill in the blank: "${blankedSentence}"`;
            
        } catch (error) {
            // Check if we have a cached sentence as fallback
            if (this.openaiCache[word]) {
                console.log(`API failed, using cached sentence for word: ${word}`);
                return this.openaiCache[word];
            }
            
            // Show user-friendly error message for API quota limit
            questionElement.innerHTML = `
                <div class="api-limit-message">
                    <p><strong>AI Question Generation Temporarily Unavailable</strong></p>
                    <p>We've reached our daily quota for AI-generated questions.</p>
                    <p>Cached responses will be used when available.</p>
                    <p style="font-style: italic; color: #666; margin-top: 10px;">
                        For now, you can still practice with the sign word: <strong>"${word}"</strong>
                    </p>
                </div>
            `;
            console.error('Failed to generate question for word:', word, error);
        }
    }
    
    resetQuestionText() {
        const questionElement = document.querySelector('.question-section h2');
        questionElement.textContent = 'What sign is being demonstrated?';
    }

    displayOptions(options) {
        this.optionsContainer.innerHTML = '';
        
        // Check section type based on question index
        const isSection3 = this.currentQuestionIndex >= 10; // Questions 11-15
        const isSection2 = this.currentQuestionIndex >= 5 && this.currentQuestionIndex <= 9; // Questions 6-10
        
        if (isSection3) {
            // For Section 3 questions, show text input for describing steps
            this.optionsContainer.className = 'options-container section3-input';
            
            const inputContainer = document.createElement('div');
            inputContainer.className = 'section3-input-container';
            
            // Check if there's a previous answer
            const previousAnswer = this.userAnswers[this.currentQuestionIndex];
            const previousText = previousAnswer ? previousAnswer.userAnswer : '';
            
            inputContainer.innerHTML = `
                <div class="input-label">
                    <label for="section3-textarea">Describe the steps to perform this sign:</label>
                </div>
                <textarea 
                    id="section3-textarea" 
                    class="section3-textarea" 
                    placeholder="Enter your description of how to perform this sign gesture..."
                    rows="6"
                >${previousText}</textarea>
                <div class="input-helper">
                    <small>Describe the hand movements, position, and any other relevant details.</small>
                </div>
            `;
            
            this.optionsContainer.appendChild(inputContainer);
            
            // Add event listener for text input
            const textarea = inputContainer.querySelector('.section3-textarea');
            textarea.addEventListener('input', () => {
                const currentSign = this.signs[this.currentQuestionIndex];
                this.selectTextAnswer(textarea.value, currentSign);
            });
            
        } else if (isSection2) {
            // For Section 2 questions, show video options
            this.optionsContainer.className = 'options-container video-options';
            
            options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'video-option-btn';
                
                // Check if this option was previously selected
                const previousAnswer = this.userAnswers[this.currentQuestionIndex];
                if (previousAnswer && previousAnswer.userAnswer === option.name) {
                    optionDiv.classList.add('selected');
                }
                
                optionDiv.innerHTML = `
                    <video class="option-video" muted loop>
                        <source src="data:video/mp4;base64,${option.base64}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="option-label">${String.fromCharCode(65 + index)}</div>
                `;
                
                optionDiv.onclick = () => this.selectAnswer(option, optionDiv);
                
                // Add hover events to play/pause videos
                const video = optionDiv.querySelector('.option-video');
                
                optionDiv.addEventListener('mouseenter', () => {
                    video.play().catch(error => {
                        console.log('Video autoplay failed:', error);
                    });
                });
                
                optionDiv.addEventListener('mouseleave', () => {
                    video.pause();
                    video.currentTime = 0;
                });
                
                this.optionsContainer.appendChild(optionDiv);
                
                // Start playing the video after a short delay to ensure it's loaded
                setTimeout(() => {
                    video.play().catch(error => {
                        console.log('Initial video play failed:', error);
                    });
                }, 100 * index); // Stagger the start times slightly
            });
        } else {
            // For Section 1 questions, show text cards in 2x2 grid
            this.optionsContainer.className = 'options-container text-cards';
            
            options.forEach((option, index) => {
                const optionCard = document.createElement('div');
                optionCard.className = 'text-option-card';
                
                // Check if this option was previously selected
                const previousAnswer = this.userAnswers[this.currentQuestionIndex];
                if (previousAnswer && previousAnswer.userAnswer === option.name) {
                    optionCard.classList.add('selected');
                }
                
                optionCard.innerHTML = `
                    <div class="card-content">
                        <div class="option-text">${option.name}</div>
                    </div>
                    <div class="option-label">${String.fromCharCode(65 + index)}</div>
                `;
                
                optionCard.onclick = () => this.selectAnswer(option, optionCard);
                this.optionsContainer.appendChild(optionCard);
            });
        }
    }

    selectAnswer(selectedSign, selectedButton) {
        if (this.isQuizSubmitted) return;
        
        // Clear previous selection based on question type
        if (this.currentQuestionIndex >= 5 && this.currentQuestionIndex <= 9) {
            // Section 2 - video options
            const videoOptions = this.optionsContainer.querySelectorAll('.video-option-btn');
            videoOptions.forEach(btn => btn.classList.remove('selected'));
        } else {
            // Section 1 - text cards
            const textCards = this.optionsContainer.querySelectorAll('.text-option-card');
            textCards.forEach(card => card.classList.remove('selected'));
        }
        
        // Mark current selection
        selectedButton.classList.add('selected');
        
        // Store answer without evaluation
        const correctSign = this.signs[this.currentQuestionIndex];
        const answerData = {
            question: correctSign.name,
            userAnswer: selectedSign.name,
            correctAnswer: correctSign.name,
            isCorrect: null // Will be evaluated on submit
        };
        
        // Store AI sentence if this is a Section 2 question (questions 6-10)
        if (this.currentQuestionIndex >= 5 && this.currentQuestionIndex < 10 && this.aiSentence) {
            answerData.aiSentence = this.aiSentence;
        }
        
        this.userAnswers[this.currentQuestionIndex] = answerData;
        
        this.updateButtonVisibility();
        this.updateSidebarHighlight();
        this.updateProgressBar(); // Update progress when answer is selected
    }

    selectTextAnswer(userText, correctSign) {
        if (this.isQuizSubmitted) return;
        
        // Store text answer without evaluation (will be manually graded)
        this.userAnswers[this.currentQuestionIndex] = {
            question: correctSign.name,
            userAnswer: userText.trim(),
            correctAnswer: `Describe the steps to perform the "${correctSign.name}" sign`,
            isCorrect: null // Will need manual evaluation
        };
        
        this.updateButtonVisibility();
        this.updateSidebarHighlight();
        this.updateProgressBar();
    }

    updateButtonVisibility() {
        const currentAnswer = this.userAnswers[this.currentQuestionIndex];
        const hasAnswer = currentAnswer !== null && 
                         (this.currentQuestionIndex < 10 || 
                          (this.currentQuestionIndex >= 10 && currentAnswer.userAnswer.trim().length > 0));
        const isLastQuestion = this.currentQuestionIndex === this.signs.length - 1;
        const allAnswered = this.userAnswers.every(answer => 
            answer !== null && 
            (answer.userAnswer !== null && answer.userAnswer.toString().trim().length > 0));
        
        // Hide replay button for Section 3 questions (11-15) since there's no video
        if (this.currentQuestionIndex >= 10) {
            this.replayBtn.classList.add('hidden');
        } else {
            this.replayBtn.classList.remove('hidden');
        }
        
        // Show next button if answered and not last question
        if (hasAnswer && !isLastQuestion) {
            this.nextBtn.classList.remove('hidden');
        } else {
            this.nextBtn.classList.add('hidden');
        }
        
        // Show submit button if all questions answered
        if (allAnswered && !this.isQuizSubmitted) {
            this.submitBtn.classList.remove('hidden');
        } else {
            this.submitBtn.classList.add('hidden');
        }
    }

    async submitQuiz() {
        this.isQuizSubmitted = true;
        this.score = 0;
        
        // Show loading message for Section 3 evaluation if needed
        const hasSection3Answers = this.userAnswers.slice(10).some(answer => 
            answer && answer.userAnswer && answer.userAnswer.trim().length > 0);
        
        if (hasSection3Answers && !this.openaiDisabled) {
            this.showEvaluationLoading();
        }
        
        // Evaluate Section 1 & 2 answers (multiple choice)
        this.userAnswers.forEach((answer, index) => {
            if (answer && index < 10) { // Only sections 1 & 2
                answer.isCorrect = answer.userAnswer === answer.correctAnswer;
                if (answer.isCorrect) {
                    this.score++;
                }
            }
        });
        
        // Evaluate Section 3 answers with OpenAI (if not disabled)
        if (hasSection3Answers && !this.openaiDisabled) {
            try {
                await this.evaluateSection3Answers();
            } catch (error) {
                console.error('Failed to evaluate Section 3 answers:', error);
                // The evaluateSection3Answers method now handles fallback internally
                // No additional action needed here
            }
        } else if (hasSection3Answers) {
            // OpenAI disabled - mark as pending manual review
            this.userAnswers.slice(10).forEach(answer => {
                if (answer) {
                    answer.isCorrect = null;
                    answer.evaluation = "Manual evaluation required (AI evaluation disabled)";
                }
            });
        }
        
        // Update sidebar to show correct/incorrect status immediately
        this.updateSidebarHighlight();
        
        // Update progress bar to 100% before showing results
        this.progressFill.style.width = '100%';
        this.progressText.textContent = '100% Complete';
        
        this.showResults();
    }

    replayVideo() {
        if (this.currentQuestionIndex >= 5 && this.currentQuestionIndex <= 9) {
            // Section 2 (Questions 6-10) - replay all option videos
            const optionVideos = this.optionsContainer.querySelectorAll('.option-video');
            optionVideos.forEach(video => {
                video.currentTime = 0;
                video.play().catch(error => {
                    console.log('Video replay failed:', error);
                });
            });
        } else {
            // Section 1 (Questions 1-5) - replay main video
            this.signVideo.currentTime = 0;
            this.signVideo.play();
        }
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        
        if (this.currentQuestionIndex < this.signs.length) {
            this.displayQuestion();
        } else {
            this.showResults();
        }
    }

    updateUI() {
        this.questionCounterElement.textContent = `Question ${this.currentQuestionIndex + 1} of ${this.signs.length}`;
        this.updateProgressBar();
    }
    
    updateProgressBar() {
        const totalQuestions = this.signs.length;
        const answeredQuestions = this.userAnswers.filter(answer => answer !== null).length;
        const progressPercentage = Math.round((answeredQuestions / totalQuestions) * 100);
        
        this.progressFill.style.width = `${progressPercentage}%`;
        this.progressText.textContent = `${progressPercentage}% Complete`;
    }

    showResults() {
        this.quizContainer.classList.add('hidden');
        this.resultsContainer.classList.remove('hidden');
        this.isInResultsSummary = true; // Set flag when showing results
        
        const percentage = Math.round((this.score / this.signs.length) * 100);
        this.finalScoreElement.textContent = `Your Score: ${this.score}/${this.signs.length} (${percentage}%)`;
        
        // Start the complete quiz replay chat
        this.startQuizReplayChat();
        
        // Update sidebar to show no current question
        this.updateSidebarHighlight();
    }
    
    async startQuizReplayChat() {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        // Reset skip flag and show skip button
        this.chatSkipAnimations = false;
        this.chatSkipBtn.classList.remove('hidden');
        
        // Welcome message
        await this.addChatMessage('bot', `🎉 Let's review your Sign Language Quiz journey together!`);
        await this.delay(1000);
        
        await this.addChatMessage('bot', `I'll replay each question, show your answers, and give you feedback. Ready? 🚀`);
        await this.delay(1500);
        
        // Replay each question as a conversation
        for (let i = 0; i < this.signs.length; i++) {
            await this.replayQuestionAsChat(i);
            
            // Add a small pause between questions (except for the last one)
            if (i < this.signs.length - 1) {
                await this.delay(800);
            }
        }
        
        // Final summary
        await this.delay(1000);
        await this.showFinalSummary();
    }
    
    async replayQuestionAsChat(questionIndex) {
        const sign = this.signs[questionIndex];
        const answer = this.userAnswers[questionIndex];
        
        // Bot asks the question
        if (questionIndex < 5) {
            // Section 1: Text-based questions
            await this.addChatMessage('bot', `<strong>Question ${questionIndex + 1}:</strong> What sign was being demonstrated?`);
        } else if (questionIndex < 10) {
            // Section 2: Video-based questions - use AI generated sentence with blanks
            let sentenceText = "I need to practice my ___ skills every day";
            
            // Try to get the AI generated sentence from the stored answer
            if (answer && answer.aiSentence) {
                // Replace the sign name with blanks in the sentence
                const signName = sign.name.toLowerCase();
                const blankLength = signName.length;
                const blanks = '_'.repeat(blankLength);
                
                // Create case-insensitive regex to find and replace the sign name
                const regex = new RegExp(`\\b${signName}\\b`, 'gi');
                sentenceText = answer.aiSentence.replace(regex, blanks);
                
                // If no replacement occurred, try partial matches or fallback
                if (sentenceText === answer.aiSentence) {
                    // Try to find the sign name as part of a word
                    const partialRegex = new RegExp(signName, 'gi');
                    if (partialRegex.test(answer.aiSentence)) {
                        sentenceText = answer.aiSentence.replace(partialRegex, blanks);
                    } else {
                        // Fallback: just add blanks at the end
                        sentenceText = `I need to practice my ${blanks} skills every day`;
                    }
                }
            }
            
            await this.addChatMessage('bot', `<strong>Question ${questionIndex + 1}:</strong> "${sentenceText}"`);
        } else {
            // Section 3: Description questions
            await this.addChatMessage('bot', `<strong>Question ${questionIndex + 1}:</strong> You have been given the sign word: "<strong>${sign.name}</strong>" Describe the steps to perform this sign's gesture:`);
        }
        
        await this.delay(1000);
        
        // User's answer
        if (answer) {
            if (questionIndex < 10) {
                // Multiple choice answer
                await this.addChatMessage('user', `${answer.userAnswer}`);
            } else {
                // Text description (show preview if too long)
                const answerText = answer.userAnswer.length > 150 
                    ? answer.userAnswer.substring(0, 150) + '...' 
                    : answer.userAnswer;
                await this.addChatMessage('user', answerText);
            }
        } else {
            await this.addChatMessage('user', `<em>No answer provided</em>`);
        }
        
        await this.delay(800);
        
        // Bot's evaluation/feedback
        await this.provideBotFeedback(questionIndex, sign, answer);
    }
    
    async provideBotFeedback(questionIndex, sign, answer) {
        if (!answer) {
            await this.addChatMessage('bot', `❌ You didn't answer this question. The correct answer was: <strong>"${sign.name}"</strong>`);
            return;
        }
        
        if (questionIndex < 10) {
            // Multiple choice feedback
            if (answer.isCorrect) {
                const encouragements = [
                    "✅ Perfect! Great job!",
                    "✅ Excellent! You got it right!",
                    "✅ Correct! Well done!",
                    "✅ That's right! Nice work!",
                    "✅ Spot on! Keep it up!"
                ];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                await this.addChatMessage('bot', randomEncouragement);
            } else {
                await this.addChatMessage('bot', `❌ Not quite right. You answered "<strong>${answer.userAnswer}</strong>" but the correct answer was "<strong>${sign.name}</strong>". Keep practicing! 💪`);
            }
        } else {
            // Section 3: Description feedback
            if (answer.evaluation) {
                let feedbackIcon = '📝';
                let feedbackIntro = 'Here\'s my evaluation of your description:';
                
                if (answer.score >= 8) {
                    feedbackIcon = '🌟';
                    feedbackIntro = 'Excellent description! Here\'s my detailed feedback:';
                } else if (answer.score >= 6) {
                    feedbackIcon = '👍';
                    feedbackIntro = 'Good description! Here\'s how you can improve:';
                } else if (answer.score >= 4) {
                    feedbackIcon = '📝';
                    feedbackIntro = 'You\'re on the right track! Here\'s my feedback:';
                } else {
                    feedbackIcon = '💡';
                    feedbackIntro = 'Here are some tips to improve your description:';
                }
                
                const scoreClass = answer.score >= 7 ? 'high' : answer.score >= 4 ? 'medium' : 'low';
                const feedbackHtml = `
                    <div>${feedbackIcon} ${feedbackIntro}</div>
                    <div style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.15); border-radius: 8px; border-left: 4px solid ${answer.score >= 7 ? '#48bb78' : answer.score >= 4 ? '#ed8936' : '#f56565'};">
                        <div style="margin-bottom: 8px;"><strong>Score: ${answer.score}/10</strong></div>
                        <div>${answer.evaluation}</div>
                    </div>
                `;
                await this.addChatMessage('bot', feedbackHtml);
            } else {
                await this.addChatMessage('bot', `📝 I wasn't able to evaluate your description due to technical limitations, but thank you for your detailed response about the "${sign.name}" sign!`);
            }
        }
    }
    
    async showFinalSummary() {
        const percentage = Math.round((this.score / this.signs.length) * 100);
        
        await this.addChatMessage('bot', `🎊 <strong>Quiz Complete!</strong> Here's your final summary:`);
        await this.delay(1000);
        
        // Overall score with encouragement
        const scoreMessage = `📊 <strong>Final Score: ${this.score}/${this.signs.length} (${percentage}%)</strong>`;
        let encouragement = '';
        if (percentage >= 90) {
            encouragement = "🏆 Outstanding! You're a sign language champion!";
        } else if (percentage >= 80) {
            encouragement = "🌟 Excellent work! You have great sign language skills!";
        } else if (percentage >= 70) {
            encouragement = "👏 Well done! You're making great progress!";
        } else if (percentage >= 60) {
            encouragement = "� Good effort! Keep practicing and you'll improve!";
        } else {
            encouragement = "📚 Great start! Sign language takes practice - you're on the right path!";
        }
        
        await this.addChatMessage('bot', `${scoreMessage}<br><br>${encouragement}`);
        await this.delay(1000);
        
        // Section breakdown
        await this.addChatMessage('bot', `📈 <strong>Section Breakdown:</strong>`);
        await this.delay(500);
        
        const section1Score = this.userAnswers.slice(0, 5).filter(answer => answer && answer.isCorrect).length;
        const section2Score = this.userAnswers.slice(5, 10).filter(answer => answer && answer.isCorrect).length;
        const section3Score = this.userAnswers.slice(10, 15).filter(answer => answer && answer.isCorrect).length;
        
        const breakdownHtml = `
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 10px 0;">
                <div style="margin-bottom: 10px;">� <strong>Section 1 (Text Recognition):</strong> ${section1Score}/5</div>
                <div style="margin-bottom: 10px;">📹 <strong>Section 2 (Video Recognition):</strong> ${section2Score}/5</div>
                <div style="margin-bottom: 10px;">✍️ <strong>Section 3 (Sign Description):</strong> ${section3Score}/5</div>
            </div>
        `;
        
        await this.addChatMessage('bot', breakdownHtml);
        await this.delay(1000);
        
        await this.addChatMessage('bot', `🔍 Want to dive deeper into specific questions? Use the "<strong>Review Answers</strong>" button above for detailed analysis!`);
        await this.delay(500);
        
        await this.addChatMessage('bot', `Thanks for taking the Sign Language Quiz! Keep practicing and you'll continue to improve! 🌟`);
        
        // Hide skip button when chat is complete
        this.chatSkipBtn.classList.add('hidden');
    }
    
    async addChatMessage(type, content) {
        const chatMessages = document.getElementById('chat-messages');
        
        // Add typing indicator for bot messages (only if animations are enabled)
        if (type === 'bot' && !this.chatSkipAnimations) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message bot typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-avatar bot"></div>
                <div class="message-bubble bot">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            await this.delay(800);
            chatMessages.removeChild(typingDiv);
        }
        
        // Add actual message
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${type}`;
        
        const avatar = type === 'bot' ? '' : '👤';
        const avatarClass = type === 'bot' ? 'bot' : 'user';
        
        messageDiv.innerHTML = `
            <div class="message-avatar ${avatarClass}">${avatar}</div>
            <div class="message-bubble ${type}">
                <div class="message-text">${content}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return new Promise(resolve => setTimeout(resolve, this.chatSkipAnimations ? 0 : 200));
    }
    
    delay(ms) {
        if (this.chatSkipAnimations) {
            return Promise.resolve(); // Skip delay when animations are disabled
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    skipChatAnimations() {
        this.chatSkipAnimations = true;
        this.chatSkipBtn.classList.add('hidden');
        
        // Speed up the current chat replay by resolving any pending delays
        // This will make the remaining messages appear instantly
    }

    restartQuiz() {
        this.resultsContainer.classList.add('hidden');
        this.loadingElement.classList.remove('hidden');
        
        // Reset quiz state
        this.isQuizSubmitted = false;
        this.currentReviewIndex = 0;
        this.isInReviewMode = false; // Reset review mode flag
        this.isInResultsSummary = false; // Reset results summary flag
        
        // Reset review mode
        this.exitReviewMode();
        
        // Only shuffle existing data - no need to reload from Firestore
        this.shuffleArray(this.signs);
        setTimeout(() => {
            this.hideLoading();
            this.generateSidebar();
            this.startQuiz();
        }, 500); // Reduced delay since no network calls
    }
    
    // Review Mode Methods
    enterReviewMode() {
        this.currentReviewIndex = 0;
        this.isInReviewMode = true;
        this.isInResultsSummary = false; // No longer viewing summary
        this.resultsSummary.classList.add('hidden');
        this.reviewMode.classList.remove('hidden');
        this.reviewModeBtn.classList.add('hidden');
        this.summaryModeBtn.classList.remove('hidden');
        this.displayReviewQuestion();
        this.updateSidebarHighlight(); // Update sidebar to show review mode
    }
    
    exitReviewMode() {
        this.isInReviewMode = false;
        this.isInResultsSummary = true; // Back to viewing summary
        this.resultsSummary.classList.remove('hidden');
        this.reviewMode.classList.add('hidden');
        this.reviewModeBtn.classList.remove('hidden');
        this.summaryModeBtn.classList.add('hidden');
        this.updateSidebarHighlight(); // Reset sidebar highlight
    }
    
    displayReviewQuestion() {
        const answer = this.userAnswers[this.currentReviewIndex];
        const sign = this.signs[this.currentReviewIndex];
        
        // Update header
        this.reviewQuestionTitle.textContent = `Question ${this.currentReviewIndex + 1} of ${this.signs.length}`;
        this.reviewQuestionCounter.textContent = `${this.currentReviewIndex + 1} / ${this.signs.length}`;
        
        // Check if this is a Section 3 question (questions 11-15)
        const isSection3 = this.currentReviewIndex >= 10;
        
        if (isSection3) {
            // Section 3 - Text input with AI evaluation
            this.handleSection3Review(answer, sign);
        } else {
            // Section 1 & 2 - Multiple choice
            this.handleMultipleChoiceReview(answer, sign);
        }
        
        // Update navigation buttons
        this.reviewPrevBtn.disabled = this.currentReviewIndex === 0;
        this.reviewNextBtn.disabled = this.currentReviewIndex === this.signs.length - 1;
    }
    
    handleMultipleChoiceReview(answer, sign) {
        // Update status
        this.reviewStatus.textContent = answer.isCorrect ? 'Correct' : 'Incorrect';
        this.reviewStatus.className = `review-status ${answer.isCorrect ? 'correct' : 'incorrect'}`;
        
        // Show video container and traditional review answers, hide Section 3 elements
        this.reviewVideoContainer.classList.remove('hidden');
        this.showTraditionalReviewAnswers();
        this.hideSection3ReviewElements();
        
        // Set video
        this.reviewVideo.src = `data:video/mp4;base64,${sign.base64}`;
        this.reviewVideo.play().catch(error => {
            console.log('Auto-play failed:', error);
        });
        
        // Update answers
        this.reviewUserAnswer.textContent = answer.userAnswer;
        this.reviewUserAnswer.className = `answer-value ${answer.isCorrect ? 'correct' : 'incorrect'}`;
        
        this.reviewCorrectAnswer.textContent = answer.correctAnswer;
        this.reviewCorrectAnswer.className = 'answer-value neutral';
        
        // Show sentence for Section 2 questions (6-10) in review mode
        if (this.currentReviewIndex >= 5 && this.currentReviewIndex <= 9) {
            const word = sign.name;
            const cachedSentence = this.openaiCache[word];
            if (cachedSentence) {
                this.showReviewSentence(word, cachedSentence);
            } else {
                this.hideReviewSentence();
            }
        } else {
            this.hideReviewSentence();
        }
    }
    
    handleSection3Review(answer, sign) {
        // Update status based on evaluation score
        const hasEvaluation = answer.evaluation && answer.score !== undefined;
        if (hasEvaluation) {
            const scoreText = `Score: ${answer.score}/10`;
            this.reviewStatus.textContent = answer.isCorrect ? `Correct (${scoreText})` : `Needs Improvement (${scoreText})`;
            this.reviewStatus.className = `review-status ${answer.isCorrect ? 'correct' : 'incorrect'}`;
        } else {
            this.reviewStatus.textContent = 'Evaluation Pending';
            this.reviewStatus.className = 'review-status incorrect';
        }
        
        // Show video container and hide traditional review answers for Section 3
        this.reviewVideoContainer.classList.remove('hidden');
        this.hideTraditionalReviewAnswers();
        
        // Set video for Section 3
        this.reviewVideo.src = `data:video/mp4;base64,${sign.base64}`;
        this.reviewVideo.play().catch(error => {
            console.log('Auto-play failed:', error);
        });
        
        // Show Section 3 specific elements
        this.showSection3ReviewElements(answer, sign);
        
        // Hide sentence display for Section 3
        this.hideReviewSentence();
    }
    
    showSection3ReviewElements(answer, sign) {
        // Create or get Section 3 review container
        let section3ReviewContainer = document.getElementById('section3-review-container');
        if (!section3ReviewContainer) {
            section3ReviewContainer = document.createElement('div');
            section3ReviewContainer.id = 'section3-review-container';
            section3ReviewContainer.className = 'section3-review-container';
            
            // Insert after the review answers div
            const reviewAnswers = document.querySelector('.review-answers');
            reviewAnswers.parentNode.insertBefore(section3ReviewContainer, reviewAnswers.nextSibling);
        }
        
        // Display Section 3 question and evaluation
        const questionText = `Describe how to perform the sign for "${sign.name}":`;
        const userAnswer = answer.userAnswer || 'No answer provided';
        const evaluation = answer.evaluation || 'Evaluation not available';
        const score = answer.score || 0;
        
        section3ReviewContainer.innerHTML = `
            <div class="section3-review-question">
                <h4>Question:</h4>
                <p>${questionText}</p>
            </div>
            
            <div class="section3-review-answer">
                <h4>Your Answer:</h4>
                <div class="user-answer-text">${userAnswer}</div>
            </div>
            
            <div class="section3-evaluation">
                <div class="evaluation-score ${score >= 7 ? 'high-score' : 'low-score'}">
                    <span>AI Evaluation Score:</span>
                    <span class="score-value">${score}/10</span>
                </div>
                <div class="evaluation-feedback">
                    ${evaluation}
                </div>
            </div>
        `;
        
        section3ReviewContainer.classList.remove('hidden');
    }
    
    hideSection3ReviewElements() {
        const section3ReviewContainer = document.getElementById('section3-review-container');
        if (section3ReviewContainer) {
            section3ReviewContainer.classList.add('hidden');
        }
    }
    
    hideTraditionalReviewAnswers() {
        const reviewAnswers = document.querySelector('.review-answers');
        if (reviewAnswers) {
            reviewAnswers.classList.add('hidden');
        }
    }
    
    showTraditionalReviewAnswers() {
        const reviewAnswers = document.querySelector('.review-answers');
        if (reviewAnswers) {
            reviewAnswers.classList.remove('hidden');
        }
    }
    
    reviewPreviousQuestion() {
        if (this.currentReviewIndex > 0) {
            this.currentReviewIndex--;
            this.displayReviewQuestion();
            this.updateSidebarHighlight();
        }
    }
    
    reviewNextQuestion() {
        if (this.currentReviewIndex < this.signs.length - 1) {
            this.currentReviewIndex++;
            this.displayReviewQuestion();
            this.updateSidebarHighlight();
        }
    }
    
    showReviewSentence(word, sentence) {
        // Create or get the review sentence container
        let reviewSentenceContainer = document.getElementById('review-sentence-container');
        if (!reviewSentenceContainer) {
            reviewSentenceContainer = document.createElement('div');
            reviewSentenceContainer.id = 'review-sentence-container';
            reviewSentenceContainer.className = 'ai-sentence-container';
            
            // Insert after review video container
            const reviewVideoContainer = document.querySelector('.review-video-container');
            reviewVideoContainer.parentNode.insertBefore(reviewSentenceContainer, reviewVideoContainer.nextSibling);
        }
        
        // For review mode, show the original sentence with the word revealed
        reviewSentenceContainer.innerHTML = `
            <div class="sentence-header">
                <h3>📝 Example Sentence for Question 6</h3>
            </div>
            <div class="sentence-content">
                <p class="generated-sentence">"${sentence}"</p>
                <small class="sentence-note">Complete sentence revealed after quiz submission</small>
            </div>
        `;
        reviewSentenceContainer.style.display = 'block';
    }
    
    hideReviewSentence() {
        const reviewSentenceContainer = document.getElementById('review-sentence-container');
        if (reviewSentenceContainer) {
            reviewSentenceContainer.style.display = 'none';
        }
    }
}

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const quiz = new SignLanguageQuiz();
    
    // Expose cache management functions globally for debugging
    window.signQuizDebug = {
        clearAllCache: () => quiz.clearAllCache(),
        clearOpenAICache: () => quiz.clearOpenAICache(),
        viewOpenAICache: () => console.log('OpenAI Cache:', quiz.openaiCache),
        viewCacheStats: () => {
            const openaiCount = Object.keys(quiz.openaiCache).length;
            const firestoreAvailable = quiz.firestoreCache ? 'Yes' : 'No';
            console.log(`Cache Stats:
- OpenAI responses cached: ${openaiCount}
- Firestore data cached: ${firestoreAvailable}
- Data loaded from cache: ${!quiz.isDataLoaded ? 'No' : 'Yes'}
- OpenAI API: ${quiz.openaiDisabled ? 'DISABLED' : 'ENABLED'}`);
        },
        enableOpenAI: () => {
            quiz.openaiDisabled = false;
            console.log('✅ OpenAI API enabled');
            // Auto-generate all Section 2 sentences in batch
            quiz.batchGenerateSentencesForSection2().then(() => {
                console.log('🚀 All Section 2 sentences ready!');
            }).catch(error => {
                console.error('❌ Batch generation failed:', error);
            });
        },
        disableOpenAI: () => {
            quiz.openaiDisabled = true;
            console.log('🚫 OpenAI API disabled (to save usage)');
        }
    };
    
    console.log('🔧 Debug functions available: window.signQuizDebug');
    console.log('📊 Use window.signQuizDebug.viewCacheStats() to see cache status');
    console.log('✅ OpenAI API is currently ENABLED by default');
    console.log('🚫 Use window.signQuizDebug.disableOpenAI() to disable OpenAI and save usage');
    console.log('🎯 Section 2 (Q6-10) will use AI-generated fill-in-the-blank format with video options');
});

// Add some CSS for error messages
const style = document.createElement('style');
style.textContent = `
    .error-message {
        text-align: center;
        padding: 40px 20px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .error-message h3 {
        color: #f56565;
        margin-bottom: 15px;
        font-size: 1.5rem;
    }
    
    .error-message p {
        color: #4a5568;
        margin-bottom: 20px;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);
