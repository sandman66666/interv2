import { HeygenService } from './services/heygen.service';
import { AvatarQuality } from '@heygen/streaming-avatar';

async function main() {
  const videoElement = document.getElementById('avatar-video') as HTMLVideoElement;
  
  const heygenService = new HeygenService({
    apiKey: 'MGNlMDBhYjdhNWM5NDQwOThhZTFlMTBjOTlhNTExMzctMTcyNzUzMjczOQ==',
    quality: AvatarQuality.Low,
    language: 'en'
  });

  try {
    // Initialize and get video stream
    const stream = await heygenService.initialize();
    
    // Attach stream to video element
    videoElement.srcObject = stream;
    
    // Make avatar speak
    await heygenService.speak('Hello! This is a test message.');
    
    // Example cleanup after 10 seconds
    setTimeout(async () => {
      await heygenService.cleanup();
    }, 10000);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();