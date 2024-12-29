import React from 'react';
import { createRoot } from 'react-dom/client';
import { HeygenService } from './services/heygen.service';
import { AvatarQuality } from '@heygen/streaming-avatar';
import { RecordingControls } from './components/RecordingControls';
import VideoInterface from './components/VideoInterface';
import './styles/globals.css';

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
        loadQuestions: () => Promise<void>;
    }
}

let isAvatarStopped = false;
let currentHeygenService: HeygenService | null = null;
let recordingControls: RecordingControls | null = null;
let isAvatarSpeaking = false;
let isInitializing = false;

// Function to load questions from server
window.loadQuestions = async () => {
    try {
        const response = await fetch('/load-questions');
        if (!response.ok) throw new Error('Failed to load questions');
        const data = await response.json();
        window.questions = data;
        window.currentQuestionIndex = window.currentQuestionIndex || 0;
        console.log('Questions loaded:', window.questions);
    } catch (error) {
        console.error('Error loading questions:', error);
    }
};

// Initial questions load
window.loadQuestions();

function addDebugLog(message: string, type: 'error' | 'info' = 'info') {
    const debugLog = document.getElementById('debug-log');
    if (debugLog) {
        const logEntry = document.createElement('div');
        logEntry.className = type === 'error' ? 'text-red-500' : 'text-gray-700';
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
        await window.loadQuestions();

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
        await cleanupAvatar();
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
        } finally {
            isInitializing = false;
            isAvatarStopped = true;
            isAvatarSpeaking = false;
        }
    }
}

async function initializeAvatar() {
    if (isInitializing) {
        console.log('Avatar initialization already in progress');
        return;
    }

    isInitializing = true;
    const videoElement = document.getElementById('avatar-video') as HTMLVideoElement;
    const startButton = document.getElementById('start-button') as HTMLButtonElement;
    const nextButton = document.getElementById('next-button') as HTMLButtonElement;
    const recordButton = document.getElementById('record-button') as HTMLButtonElement;
    
    if (!videoElement || !startButton || !nextButton || !recordButton) {
        addDebugLog('Required elements not found!', 'error');
        isInitializing = false;
        return;
    }

    // Reset state
    isAvatarStopped = false;
    isAvatarSpeaking = false;
    window.currentQuestionIndex = 0;

    // Ensure cleanup of any existing service
    if (currentHeygenService) {
        await cleanupAvatar();
    }

    try {
        addDebugLog('Creating HeygenService...');
        currentHeygenService = new HeygenService({
            apiKey: 'MGNlMDBhYjdhNWM5NDQwOThhZTFlMTBjOTlhNTExMzctMTcyNzUzMjczOQ==',
            quality: AvatarQuality.Low,
            avatarId: 'Anna_public_3_20240108',
            language: 'en'
        });

        addDebugLog('Initializing avatar...');
        const stream = await currentHeygenService.initialize();
        
        if (!stream) {
            throw new Error('Failed to initialize avatar stream');
        }

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
                
                if (recordingControls) {
                    recordingControls.initializeUserVideo();
                }
                
                await playNextQuestion();
            } catch (error) {
                console.error('Error playing video:', error);
                addDebugLog(`Failed to play video: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
                await cleanupAvatar();
            }
        };

        videoElement.onerror = async (e) => {
            const error = e as ErrorEvent;
            addDebugLog(`Video error: ${error.message || 'Unknown error'}`, 'error');
            await cleanupAvatar();
        };

    } catch (error) {
        console.error('Application error:', error);
        addDebugLog(error instanceof Error ? error.message : 'Failed to initialize avatar', 'error');
        await cleanupAvatar();
    }
}

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
    }

    // Add visibility change listener to handle page focus
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden && currentHeygenService) {
            await cleanupAvatar();
        }
    });

    // Handle page unload
    window.addEventListener('beforeunload', async () => {
        if (currentHeygenService) {
            await cleanupAvatar();
        }
    });
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(React.createElement(VideoInterface));

    const waitForButtons = () => {
        return new Promise<void>((resolve) => {
            const check = () => {
                const startButton = document.getElementById('start-button');
                const nextButton = document.getElementById('next-button');
                const recordButton = document.getElementById('record-button');

                if (startButton && nextButton && recordButton) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    };

    waitForButtons().then(() => {
        console.log('Buttons found, initializing application...');
        init();
    });
}