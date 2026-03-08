const { execSync } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

async function testGroqTranscription() {
  const videoId = 'd6NItqKAw8s'; // The Shorts video that failed earlier
  const audioFile = `temp_${videoId}.m4a`;

  console.log('Downloading audio with yt-dlp...');
  try {
    // We use m4a to avoid needing ffmpeg to convert to mp3
    execSync(`.\\yt-dlp.exe -f "bestaudio[ext=m4a]" --output ${audioFile} https://www.youtube.com/watch?v=${videoId}`, { stdio: 'inherit' });
    console.log('Audio downloaded successfully.');
  } catch (err) {
    console.error('Failed to download audio:', err.message);
    return;
  }

  console.log('Sending audio to Groq Whisper API...');
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile));
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('language', 'en');

    const res = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      }
    });

    console.log('Transcription Success!');
    console.log(res.data.text);
  } catch (err) {
    console.error('Transcription failed:', err.response?.data?.error?.message || err.message);
  } finally {
    if (fs.existsSync(audioFile)) {
       fs.unlinkSync(audioFile);
    }
  }
}

testGroqTranscription();
