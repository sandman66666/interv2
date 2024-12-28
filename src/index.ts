import { HeygenService } from './services/heygen.service';
import { AvatarQuality } from '@heygen/streaming-avatar';

interface Question {
    id: number;
    text: string;
    duration: number;
}

interface QuestionData {
    questions: Question[];
}

import questionsJson from './questions.json';
const questions = questionsJson as QuestionData;

let currentQuestionIndex = 0;
let isAvatarStopped = false;
let currentHeygenService: HeygenService | null = null;

function addDebugLog(message: string, type: 'error' | 'info' = 'info') {
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
        const logEntry = document.createElement('div');
        logEntry.className = type;
        logEntry.textContent = `${new Date().toISOString()}: ${message}`;
        debugLog.appendChild(logEntry);
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
    originalLog.apply(console, args);
    addDebugLog(args.map(arg => String(arg)).join(' '), 'info');
};

console.error = (...args) => {
    originalError.apply(console, args);
    addDebugLog(args.map(arg => String(arg)).join(' '), 'error');
};

function showError(message: string) {
    addDebugLog(message, 'error');
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.backgroundColor = '#fee2e2';
    container.style.color = '#dc2626';
    container.style.padding = '1rem';
    container.style.borderRadius = '0.5rem';
    container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    container.style.zIndex = '1000';
    container.textContent = message;
    document.body.appendChild(container);
    setTimeout(() => container.remove(), 5000);
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function playNextQuestion() {
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    if (!currentHeygenService || isAvatarStopped) return;

    try {
        nextButton.disabled = true;
        
        if (currentQuestionIndex < questions.questions.length) {
            const question = questions.questions[currentQuestionIndex];
            addDebugLog(`Playing question ${question.id}: ${question.text}`);
            await currentHeygenService.speak(question.text);
            currentQuestionIndex++;

            // Enable next button if there are more questions
            if (currentQuestionIndex < questions.questions.length) {
                nextButton.disabled = false;
            } else {
                // No more questions, start cleanup
                nextButton.style.display = 'none';
                await cleanupAvatar();
            }
        }
    } catch (error) {
        console.error('Error playing question:', error);
        nextButton.disabled = false;
    }
}

async function cleanupAvatar() {
    if (currentHeygenService) {
        try {
            isAvatarStopped = true;
            addDebugLog('Starting cleanup...');
            await currentHeygenService.cleanup();
            currentHeygenService = null;
            addDebugLog('Cleanup completed');

            const startButton = document.getElementById('start-button') as HTMLButtonElement;
            const nextButton = document.getElementById('next-button') as HTMLButtonElement;
            if (startButton) {
                startButton.classList.remove('hidden');
                startButton.disabled = false;
                startButton.classList.remove('loading');
            }
            if (nextButton) {
                nextButton.style.display = 'none';
            }
        } catch (error) {
            console.error('Cleanup error:', error);
            // Continue with UI cleanup even if service cleanup fails
            currentHeygenService = null;
        }
    }
}

async function initializeAvatar() {
    const videoElement = document.getElementById('avatar-video') as HTMLVideoElement;
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    
    if (!videoElement || !startButton || !nextButton) {
        showError('Required elements not found!');
        return;
    }

    // Reset state
    isAvatarStopped = false;
    currentQuestionIndex = 0;

    try {
        addDebugLog('Creating HeygenService...');
        currentHeygenService = new HeygenService({
            apiKey: 'MGNlMDBhYjdhNWM5NDQwOThhZTFlMTBjOTlhNTExMzctMTcyNzUzMjczOQ==',
            quality: AvatarQuality.Low,
            language: 'en'
        });

        addDebugLog('Initializing avatar...');
        const stream = await currentHeygenService.initialize();
        
        addDebugLog('Setting up video stream...');
        videoElement.srcObject = stream;
        
        videoElement.onloadedmetadata = async () => {
            addDebugLog('Video metadata loaded, attempting to play...');
            try {
                await videoElement.play();
                addDebugLog('Video playing successfully');
                startButton.classList.add('hidden');
                
                // Show and enable next button
                nextButton.style.display = 'block';
                nextButton.disabled = false;
                
                // Start with first question
                await playNextQuestion();
            } catch (error) {
                console.error('Error playing video:', error);
                showError(`Failed to play video: ${error instanceof Error ? error.message : 'Unknown error'}`);
                await cleanupAvatar();
            }
        };

        videoElement.onerror = (e) => {
            const error = e as ErrorEvent;
            showError(`Video error: ${error.message || 'Unknown error'}`);
            cleanupAvatar();
        };

    } catch (err) {
        const error = err as Error;
        console.error('Application error:', error);
        showError(error.message || 'Failed to initialize avatar');
        await cleanupAvatar();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupAvatar);

// Initialize application
function init() {
    addDebugLog('Application ready...');
    
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    
    if (startButton && nextButton) {
        startButton.addEventListener('click', async () => {
            startButton.disabled = true;
            startButton.classList.add('loading');
            addDebugLog('Start button clicked...');
            await initializeAvatar();
        });

        nextButton.addEventListener('click', async () => {
            if (!nextButton.disabled) {
                await playNextQuestion();
            }
        });
    } else {
        showError('Required buttons not found!');
    }
}

// Start the application
init();