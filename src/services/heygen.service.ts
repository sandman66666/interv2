import StreamingAvatar, {
    AvatarQuality,
    StreamingEvents,
    TaskType,
    VoiceEmotion,
    StartAvatarResponse
  } from "@heygen/streaming-avatar";
  
  export interface HeygenServiceConfig {
    apiKey: string;
    avatarId?: string;
    quality?: AvatarQuality;
    language?: string;
  }
  
  export class HeygenService {
    private avatar: StreamingAvatar | null = null;
    private stream: MediaStream | null = null;
    private sessionData: StartAvatarResponse | null = null;
  
    constructor(private config: HeygenServiceConfig) {}
  
    // Initialize the avatar session
    async initialize(): Promise<MediaStream> {
      try {
        // Create new StreamingAvatar instance
        this.avatar = new StreamingAvatar({
          token: this.config.apiKey
        });
  
        // Set up event listeners
        this.setupEventListeners();
  
        // Start the avatar session
        const response = await this.avatar.createStartAvatar({
          quality: this.config.quality || AvatarQuality.Low,
          avatarName: this.config.avatarId || "Anna_public_3_20240108", // Default avatar if none specified
          voice: {
            rate: 1.5,
            emotion: VoiceEmotion.NEUTRAL
          },
          language: this.config.language || "en",
          disableIdleTimeout: true
        });
  
        this.sessionData = response;
  
        // Wait for stream to be ready
        const stream = await this.waitForStream();
        this.stream = stream;
  
        return stream;
  
      } catch (error) {
        throw new Error(`Failed to initialize Heygen avatar: ${error}`);
      }
    }
  
    // Speak text through the avatar
    async speak(text: string): Promise<void> {
      if (!this.avatar || !this.sessionData) {
        throw new Error('Avatar not initialized. Call initialize() first.');
      }
  
      try {
        await this.avatar.speak({ 
          text,
          taskType: TaskType.REPEAT
        });
      } catch (error) {
        throw new Error(`Failed to speak text: ${error}`);
      }
    }
  
    // Stop the current speaking task
    async interrupt(): Promise<void> {
      if (!this.avatar) {
        return;
      }
  
      try {
        await this.avatar.interrupt();
      } catch (error) {
        throw new Error(`Failed to interrupt avatar: ${error}`);
      }
    }
  
    // End the avatar session
    async cleanup(): Promise<void> {
      if (this.avatar) {
        await this.avatar.stopAvatar();
        this.avatar = null;
        this.stream = null;
        this.sessionData = null;
      }
    }
  
    private setupEventListeners(): void {
      if (!this.avatar) return;
  
      this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('Avatar started talking');
      });
  
      this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('Avatar stopped talking');
      });
  
      this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('Stream disconnected');
        this.cleanup();
      });
    }
  
    private waitForStream(): Promise<MediaStream> {
      return new Promise((resolve, reject) => {
        if (!this.avatar) {
          reject(new Error('Avatar not initialized'));
          return;
        }
  
        const timeout = setTimeout(() => {
          reject(new Error('Stream ready timeout'));
        }, 10000);
  
        this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
          clearTimeout(timeout);
          resolve(event.detail);
        });
      });
    }
  }
  
  // Usage example:
  /*
  const heygenService = new HeygenService({
    apiKey: 'your-api-key',
    avatarId: 'optional-avatar-id',
    quality: AvatarQuality.Low,
    language: 'en'
  });
  
  // Initialize and get video stream
  const stream = await heygenService.initialize();
  
  // Attach stream to video element
  videoElement.srcObject = stream;
  
  // Make avatar speak
  await heygenService.speak('Hello world!');
  
  // Clean up when done
  await heygenService.cleanup();
  */