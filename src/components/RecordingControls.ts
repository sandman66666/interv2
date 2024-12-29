// src/components/RecordingControls.ts

export class RecordingControls {
    private isRecording: boolean = false;
    private isPreviewingRecording: boolean = false;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private lastRecordingBlob: Blob | null = null;

    constructor() {
        this.initializeUserVideo();
    }

    public async initializeUserVideo(): Promise<void> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            const userVideo = document.getElementById('user-video') as HTMLVideoElement;
            if (userVideo) {
                userVideo.srcObject = this.stream;
                userVideo.muted = true; // Mute to prevent feedback, but still record audio
            }
        } catch (error) {
            console.error('Failed to initialize user video:', error);
            const userVideo = document.getElementById('user-video');
            if (userVideo) {
                userVideo.classList.add('no-camera');
                if (userVideo instanceof HTMLElement) {
                    userVideo.innerHTML = 'Camera access denied or not available';
                }
            }
        }
    }

    attachToNextButton(): void {
        const recordButton = document.getElementById('record-button') as HTMLButtonElement;
        const previewButton = document.getElementById('preview-button') as HTMLButtonElement;
        const reRecordButton = document.getElementById('re-record-button') as HTMLButtonElement;
        const confirmButton = document.getElementById('confirm-button') as HTMLButtonElement;
        const nextButton = document.getElementById('next-button') as HTMLButtonElement;
        const userVideo = document.getElementById('user-video') as HTMLVideoElement;
        const previewOverlay = document.getElementById('preview-overlay');

        if (recordButton && previewButton && reRecordButton && confirmButton && nextButton && userVideo && previewOverlay) {
            recordButton.addEventListener('click', async () => {
                if (!this.isRecording) {
                    await this.startRecording();
                    recordButton.textContent = 'Stop Recording';
                    recordButton.classList.add('recording');
                    previewButton.classList.add('hidden');
                    reRecordButton.classList.add('hidden');
                    confirmButton.classList.add('hidden');
                    nextButton.classList.add('hidden');
                } else {
                    await this.stopRecording();
                    recordButton.textContent = 'Record Response';
                    recordButton.classList.remove('recording');
                    recordButton.classList.add('hidden');
                    
                    // Show preview option
                    previewButton.classList.remove('hidden');
                    reRecordButton.classList.remove('hidden');
                    confirmButton.classList.remove('hidden');
                    previewOverlay.classList.add('active');
                }
            });

            previewButton.addEventListener('click', () => {
                if (this.lastRecordingBlob) {
                    const recordingUrl = URL.createObjectURL(this.lastRecordingBlob);
                    userVideo.srcObject = null;
                    userVideo.src = recordingUrl;
                    userVideo.muted = false; // Unmute for preview
                    userVideo.play();
                    this.isPreviewingRecording = true;
                    previewOverlay.classList.remove('active');
                    
                    // Reset to live view when preview ends
                    userVideo.onended = () => {
                        if (this.stream) {
                            userVideo.srcObject = this.stream;
                            userVideo.muted = true; // Mute again for live view
                            previewOverlay.classList.add('active');
                        }
                    };
                }
            });

            reRecordButton.addEventListener('click', async () => {
                // Reset to live camera view
                if (this.stream) {
                    userVideo.srcObject = this.stream;
                    userVideo.muted = true;
                    previewOverlay.classList.remove('active');
                }
                
                // Reset recording state
                this.lastRecordingBlob = null;
                this.isPreviewingRecording = false;
                
                // Show record button, hide others
                recordButton.classList.remove('hidden');
                previewButton.classList.add('hidden');
                reRecordButton.classList.add('hidden');
                confirmButton.classList.add('hidden');
            });

            confirmButton.addEventListener('click', () => {
                // Hide review controls
                previewButton.classList.add('hidden');
                reRecordButton.classList.add('hidden');
                confirmButton.classList.add('hidden');
                previewOverlay.classList.remove('active');
                
                // Show next button
                nextButton.classList.remove('hidden');
                nextButton.disabled = false;
                
                // Reset to live camera view
                if (this.stream) {
                    userVideo.srcObject = this.stream;
                    userVideo.muted = true;
                }
            });
        }
    }

    private async startRecording(): Promise<void> {
        try {
            // Get both video and audio streams
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Update the video preview with the new stream
            const userVideo = document.getElementById('user-video') as HTMLVideoElement;
            if (userVideo) {
                userVideo.srcObject = stream;
                userVideo.muted = true;
            }

            this.stream = stream;
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8,opus'
            });
            
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;

        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    private async stopRecording(): Promise<void> {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            return new Promise((resolve) => {
                if (this.mediaRecorder) {
                    this.mediaRecorder.onstop = async () => {
                        this.lastRecordingBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
                        this.isRecording = false;
                        resolve();
                    };
                    this.mediaRecorder.stop();
                }
            });
        }
    }
}