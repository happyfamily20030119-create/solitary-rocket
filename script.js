// Game State
const state = {
    currentYear: null,
    currentTopic: null,
    currentIndex: 0,
    wordList: [],
    writer: null
};

// DOM Elements
const dashboard = document.getElementById('dashboard');
const gameArea = document.getElementById('game-area');
const backBtn = document.getElementById('back-btn');
const yearDisplay = document.getElementById('current-year');
const topicDisplay = document.getElementById('current-topic');
const pinyinDisplay = document.getElementById('char-jyutping');
const meaningDisplay = document.getElementById('char-meaning');
const feedbackMsg = document.getElementById('feedback-msg');
const animateBtn = document.getElementById('animate-btn');
const soundBtn = document.getElementById('sound-btn');
const nextBtn = document.getElementById('next-btn');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    setupEventListeners();
});

function initDashboard() {
    dashboard.innerHTML = '';

    for (const [year, topics] of Object.entries(vocabData)) {
        const card = document.createElement('div');
        card.className = 'year-card';

        const h2 = document.createElement('h2');
        h2.textContent = year;
        card.appendChild(h2);

        const topicList = document.createElement('div');
        topicList.className = 'topic-list';

        for (const topic of Object.keys(topics)) {
            const tag = document.createElement('span');
            tag.className = 'topic-tag';
            tag.textContent = topic;
            tag.onclick = (e) => {
                e.stopPropagation(); // Prevent card click if we add one later
                startGame(year, topic);
            };
            topicList.appendChild(tag);
        }

        card.appendChild(topicList);

        // Allow clicking the whole card to start the first topic? 
        // Or just keep it to tags for precision. Let's keep to tags.

        dashboard.appendChild(card);
    }
}

function setupEventListeners() {
    backBtn.addEventListener('click', showDashboard);

    animateBtn.addEventListener('click', () => {
        if (state.writer) {
            state.writer.animateCharacter();
        }
    });

    soundBtn.addEventListener('click', () => {
        playAudio(getCurrentChar().char);
    });

    nextBtn.addEventListener('click', nextCharacter);
}

function startGame(year, topic) {
    state.currentYear = year;
    state.currentTopic = topic;
    state.wordList = vocabData[year][topic];
    state.currentIndex = 0;

    yearDisplay.textContent = year;
    topicDisplay.textContent = topic;

    dashboard.style.display = 'none';
    gameArea.style.display = 'flex';

    loadCharacter();
}

function showDashboard() {
    gameArea.style.display = 'none';
    dashboard.style.display = 'grid';
    // Clean up writer
    if (state.writer) {
        // No direct destroy method in basic API, but we clear the target container
        document.getElementById('character-target').innerHTML = '';
        state.writer = null;
    }
}

function getCurrentChar() {
    return state.wordList[state.currentIndex];
}

function loadCharacter() {
    const current = getCurrentChar();

    pinyinDisplay.textContent = current.jyutping;
    meaningDisplay.textContent = current.meaning;
    feedbackMsg.textContent = "Draw the character below!";
    feedbackMsg.style.color = "var(--text-main)";

    // Reset Writer
    document.getElementById('character-target').innerHTML = '';

    // Initialize HanziWriter
    // For Traditional characters, sometimes we need to ensure the data source is correct.
    // HanziWriter defaults to standard stroke data which often covers both.
    state.writer = HanziWriter.create('character-target', current.char, {
        width: 260,
        height: 260,
        padding: 5,
        showOutline: true,
        strokeAnimationSpeed: 1, // 1x speed
        delayBetweenStrokes: 200,
        radicalColor: '#38bdf8', // primary color
        onCorrectStroke: () => {
            feedbackMsg.textContent = "Good!";
            feedbackMsg.style.color = "var(--success-color)";
        },
        onMistake: (strokeData) => {
            feedbackMsg.textContent = "Try again!";
            feedbackMsg.style.color = "var(--error-color)";
        },
        onComplete: () => {
            feedbackMsg.textContent = "Excellent! Completed.";
            feedbackMsg.style.color = "var(--success-color)";
            playAudio(current.char); // Auto-play audio on complete

            // Animation celebration
            setTimeout(() => {
                // Pulse effect or similar could go here
            }, 500);
        }
    });

    // Start Quiz mode
    state.writer.quiz();
}

function nextCharacter() {
    if (state.currentIndex < state.wordList.length - 1) {
        state.currentIndex++;
        loadCharacter();
    } else {
        feedbackMsg.textContent = "Topic Completed! Great job!";
        feedbackMsg.style.color = "var(--success-color)";
        // Optional: Return to menu after a delay
    }
}

// Cantonese Text-to-Speech
function playAudio(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);

        // Find Cantonese voice
        const voices = window.speechSynthesis.getVoices();
        // Look for 'HK' or 'Cantonese' or 'yue'
        const cantoneseVoice = voices.find(voice =>
            voice.lang.includes('zh-HK') ||
            voice.lang.includes('yue') ||
            voice.name.includes('Cantonese')
        );

        if (cantoneseVoice) {
            utterance.voice = cantoneseVoice;
            utterance.lang = cantoneseVoice.lang; // Ensure lang is set
        } else {
            console.warn("Cantonese voice not found. Fallback to default (likely Mandarin or System default).");
            // Still try to set lang to zh-HK just in case the system handles it dynamically
            utterance.lang = 'zh-HK';
        }

        utterance.rate = 0.8; // Slightly slower for learning
        window.speechSynthesis.speak(utterance);
    } else {
        console.error("Browser does not support TTS.");
        feedbackMsg.textContent = "Audio not supported in this browser.";
    }
}

// Pre-load voices (sometimes getVoices is empty on first load)
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
    };
}
