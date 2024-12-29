import { HeygenService } from './services/heygen.service';
import { AvatarQuality } from '@heygen/streaming-avatar';
import { RecordingControls } from './components/RecordingControls';
import questionsJson from './questions.json';

interface Question {
    id: number;
    text: string;
    duration: number;
}

interface QuestionData {
    questions: Question[];
}

declare global {
    interface Window {
        questions: QuestionData;
        currentQuestionIndex: number;
    }
}

// Make questions available globally for the RecordingControls
window.questions = questionsJson as QuestionData;
window.currentQuestionIndex = 0;

let isAvatarStopped = false;
let currentHeygenService: HeygenService | null = null;
let recordingControls: RecordingControls | null = null;
let isAvatarSpeaking = false;

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

function updateButtonStates() {
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    const recordButton = document.getElementById('record-button') as HTMLButtonElement;
    
    if (nextButton && recordButton) {
        if (isAvatarSpeaking) {
            nextButton.classList.add('hidden');
            recordButton.classList.add('hidden');
        } else {
            recordButton.classList.remove('hidden');
            recordButton.disabled = false;
            nextButton.classList.add('hidden');
        }
    }
}

async function playNextQuestion() {
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    const recordButton = document.getElementById('record-button') as HTMLButtonElement;
    
    if (!currentHeygenService || isAvatarStopped) return;

    try {
        nextButton.classList.add('hidden');
        recordButton.classList.add('hidden');
        nextButton.disabled = true;
        
        if (window.currentQuestionIndex < window.questions.questions.length) {
            const question = window.questions.questions[window.currentQuestionIndex];
            addDebugLog(`Playing question ${question.id}: ${question.text}`);
            
            isAvatarSpeaking = true;
            updateButtonStates();
            
            await currentHeygenService.speak(question.text);
            
            isAvatarSpeaking = false;
            window.currentQuestionIndex++;

            if (window.currentQuestionIndex < window.questions.questions.length) {
                updateButtonStates();
            } else {
                await cleanupAvatar();
            }
        }
    } catch (error) {
        console.error('Error playing question:', error);
        isAvatarSpeaking = false;
        updateButtonStates();
    }
}

async function cleanupAvatar() {
    if (currentHeygenService) {
        try {
            isAvatarStopped = true;
            isAvatarSpeaking = false;
            addDebugLog('Starting cleanup...');
            await currentHeygenService.cleanup();
            currentHeygenService = null;
            addDebugLog('Cleanup completed');

            const startButton = document.getElementById('start-button') as HTMLButtonElement;
            const nextButton = document.getElementById('next-button') as HTMLButtonElement;
            const recordButton = document.getElementById('record-button') as HTMLButtonElement;
            
            if (startButton) {
                startButton.classList.remove('hidden');
                startButton.disabled = false;
                startButton.classList.remove('loading');
            }
            if (nextButton) {
                nextButton.classList.add('hidden');
            }
            if (recordButton) {
                recordButton.classList.add('hidden');
            }
        } catch (error) {
            console.error('Cleanup error:', error);
            currentHeygenService = null;
        }
    }
}

async function initializeAvatar() {
    const videoElement = document.getElementById('avatar-video') as HTMLVideoElement;
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    const recordButton = document.getElementById('record-button') as HTMLButtonElement;
    
    if (!videoElement || !startButton || !nextButton || !recordButton) {
        showError('Required elements not found!');
        return;
    }

    isAvatarStopped = false;
    isAvatarSpeaking = false;
    window.currentQuestionIndex = 0;

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
                
                recordButton.classList.add('hidden');
                nextButton.classList.add('hidden');
                
                // Initialize user video stream
                if (recordingControls) {
                    recordingControls.initializeUserVideo();
                }
                
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

window.addEventListener('beforeunload', cleanupAvatar);

function init() {
    addDebugLog('Application ready...');
    
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    const recordButton = document.getElementById('record-button') as HTMLButtonElement;
    
    if (startButton && nextButton && recordButton) {
        recordingControls = new RecordingControls();
        recordingControls.attachToNextButton();

        startButton.addEventListener('click', async () => {
            startButton.disabled = true;
            startButton.classList.add('loading');
            addDebugLog('Start button clicked...');
            await initializeAvatar();
        });

        nextButton.addEventListener('click', async () => {
            if (!nextButton.disabled && !isAvatarSpeaking) {
                await playNextQuestion();
            }
        });
    } else {
        showError('Required buttons not found!');
    }
}

init();