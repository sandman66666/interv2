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
  private isSpeaking: boolean = false;
  private isCleaningUp: boolean = false;
  private streamReadyResolver: ((stream: MediaStream) => void) | null = null;

  constructor(private config: HeygenServiceConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    console.log('HeygenService initialized with configuration');
  }

  private async getAccessToken(): Promise<string> {
    try {
      console.log('Getting access token from Heygen API...');
      const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.config.apiKey
        },
      });
      
      const responseText = await response.text();
      console.log('Raw API response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${responseText}`);
      }

      const data = JSON.parse(responseText);
      if (!data.data?.token) {
        throw new Error('Token missing from response');
      }

      console.log('Successfully received access token');
      return data.data.token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async initialize(): Promise<MediaStream> {
    try {
      const accessToken = await this.getAccessToken();
      console.log('Access token received, initializing avatar...');

      this.avatar = new StreamingAvatar({
        token: accessToken
      });

      // Set up event listeners first
      this.setupEventListeners();

      // Create a promise for the stream ready event
      const streamReadyPromise = new Promise<MediaStream>((resolve, reject) => {
        this.streamReadyResolver = resolve;
        setTimeout(() => {
          this.streamReadyResolver = null;
          reject(new Error('Stream ready timeout after 20 seconds'));
        }, 20000);
      });

      // Start avatar session
      console.log('Creating avatar session...');
      const response = await this.avatar.createStartAvatar({
        quality: this.config.quality || AvatarQuality.Low,
        avatarName: this.config.avatarId || "Anna_public_3_20240108",
        voice: {
          rate: 1.5,
          emotion: VoiceEmotion.EXCITED
        },
        language: this.config.language || "en",
        disableIdleTimeout: true
      });

      console.log('Avatar session created successfully');
      this.sessionData = response;

      // Wait for stream
      console.log('Waiting for stream...');
      const stream = await streamReadyPromise;
      this.stream = stream;
      console.log('Stream received and ready');

      return stream;
    } catch (error) {
      console.error('Error during initialization:', error);
      await this.cleanup();
      throw error;
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.avatar || !this.sessionData) {
      throw new Error('Avatar not initialized. Call initialize() first.');
    }

    if (this.isSpeaking) {
      console.log('Already speaking, waiting...');
      await new Promise<void>(resolve => {
        const checkInterval = setInterval(() => {
          if (!this.isSpeaking) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }

    try {
      this.isSpeaking = true;
      console.log('Starting to speak:', text);
      await this.avatar.speak({ 
        text,
        taskType: TaskType.REPEAT
      });

      return new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.isSpeaking) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    } catch (error) {
      this.isSpeaking = false;
      console.error('Speech failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isCleaningUp) {
      console.log('Cleanup already in progress');
      return;
    }

    this.isCleaningUp = true;

    try {
      if (this.avatar) {
        console.log('Starting cleanup...');
        if (this.isSpeaking) {
          await this.avatar.interrupt();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        await this.avatar.stopAvatar();
        this.avatar = null;
        this.stream = null;
        this.sessionData = null;
        this.streamReadyResolver = null;
        console.log('Cleanup completed successfully');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      this.isCleaningUp = false;
      this.isSpeaking = false;
    }
  }

  private setupEventListeners(): void {
    if (!this.avatar) return;

    this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      console.log('Avatar started talking');
      this.isSpeaking = true;
    });

    this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      console.log('Avatar stopped talking');
      this.isSpeaking = false;
    });

    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      console.log('Stream disconnected');
      this.cleanup();
    });

    this.avatar.on(StreamingEvents.STREAM_READY, (event) => {
      console.log('Stream ready event received');
      if (this.streamReadyResolver && event.detail instanceof MediaStream) {
        this.streamReadyResolver(event.detail);
        this.streamReadyResolver = null;
      }
    });
  }
}