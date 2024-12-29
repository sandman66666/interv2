
export class AvatarCoordinator {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private currentQuestionId: number | null = null;
    private stream: MediaStream | null = null;

    async startRecording(questionId: number): Promise<MediaStream> {
        try {
            // Get user media for recording
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Create and configure MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.recordedChunks = [];
            this.currentQuestionId = questionId;

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            // Start recording
            this.mediaRecorder.start();
            
            // Return the stream for preview
            return this.stream;
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }

    stopRecording(): void {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        // Stop all tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        this.stream = null;
        this.mediaRecorder = null;
    }

    private saveRecording(): void {
        if (this.recordedChunks.length === 0 || !this.currentQuestionId) return;

        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        
        // Save to IndexedDB or local storage
        this.saveToStorage(this.currentQuestionId, blob);

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `response-${this.currentQuestionId}.webm`;
        a.click();

        // Clean up
        URL.revokeObjectURL(url);
        this.recordedChunks = [];
        this.currentQuestionId = null;
    }

    private async saveToStorage(questionId: number, blob: Blob): Promise<void> {
        try {
            // Convert blob to base64 for storage
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result;
                localStorage.setItem(`recording-${questionId}`, base64data as string);
            };
        } catch (error) {
            console.error('Error saving recording:', error);
        }
    }

    async getRecording(questionId: number): Promise<string | null> {
        return localStorage.getItem(`recording-${questionId}`);
    }
}

export const avatarCoordinator = new AvatarCoordinator();