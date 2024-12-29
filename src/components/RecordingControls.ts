export class RecordingControls {
    private isRecording: boolean = false;
    private isPreviewingRecording: boolean = false;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private lastRecordingBlob: Blob | null = null;
    private currentDeviceId: string | null = null;

    constructor() {
        this.initializeDeviceSelector();
    }

    private async initializeDeviceSelector() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            // Create select element for camera selection
            const select = document.createElement('select');
            select.className = 'absolute top-4 right-4 px-3 py-2 bg-white border rounded-lg shadow-sm z-10';
            videoDevices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Camera ${device.deviceId.slice(0, 5)}...`;
                select.appendChild(option);
            });

            // Add to user video container
            const userVideo = document.querySelector('.user-wrapper');
            if (userVideo) {
                userVideo.appendChild(select);
            }

            // Handle camera change
            select.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.currentDeviceId = target.value;
                this.initializeUserVideo();
            });

            // Initialize with first device
            if (videoDevices.length > 0) {
                this.currentDeviceId = videoDevices[0].deviceId;
                await this.initializeUserVideo();
            }
        } catch (error) {
            console.error('Failed to enumerate devices:', error);
        }
    }

    public async initializeUserVideo(): Promise<void> {
        try {
            // Stop any existing stream
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: this.currentDeviceId ? {
                    deviceId: { exact: this.currentDeviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } : true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            const userVideo = document.getElementById('user-video') as HTMLVideoElement;
            if (userVideo) {
                userVideo.srcObject = this.stream;
                userVideo.muted = true;
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
                    userVideo.muted = false;
                    userVideo.play();
                    this.isPreviewingRecording = true;
                    previewOverlay.classList.remove('active');
                    
                    userVideo.onended = () => {
                        if (this.stream) {
                            userVideo.srcObject = this.stream;
                            userVideo.muted = true;
                            previewOverlay.classList.add('active');
                        }
                    };
                }
            });

            reRecordButton.addEventListener('click', async () => {
                if (this.stream) {
                    userVideo.srcObject = this.stream;
                    userVideo.muted = true;
                    previewOverlay.classList.remove('active');
                }
                
                this.lastRecordingBlob = null;
                this.isPreviewingRecording = false;
                
                recordButton.classList.remove('hidden');
                previewButton.classList.add('hidden');
                reRecordButton.classList.add('hidden');
                confirmButton.classList.add('hidden');
            });

            confirmButton.addEventListener('click', () => {
                previewButton.classList.add('hidden');
                reRecordButton.classList.add('hidden');
                confirmButton.classList.add('hidden');
                previewOverlay.classList.remove('active');
                
                nextButton.classList.remove('hidden');
                nextButton.disabled = false;
                
                if (this.stream) {
                    userVideo.srcObject = this.stream;
                    userVideo.muted = true;
                }
            });
        }
    }

    private async startRecording(): Promise<void> {
        try {
            if (!this.stream) {
                throw new Error('No stream available');
            }

            this.mediaRecorder = new MediaRecorder(this.stream, {
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