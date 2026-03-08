const axios = require('axios');

async function testInnerTube(videoId) {
  try {
    const res = await axios.post('https://www.youtube.com/youtubei/v1/player', {
      context: {
        client: {
          hl: 'en',
          gl: 'US',
          clientName: 'WEB',
          clientVersion: '2.20210721.00.00'
        }
      },
      videoId: videoId
    });

    const captions = res.data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (captions && captions.length > 0) {
      console.log(`Found ${captions.length} caption tracks. First URL:`, captions[0].baseUrl);
      // Fetch the actual XML
      const xmlRes = await axios.get(captions[0].baseUrl);
      console.log('XML snippet:', xmlRes.data.substring(0, 200));
    } else {
      console.log('No captions found in InnerTube response for', videoId);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

console.log('Testing Podcast Video OL7PsG18C8Y:');
testInnerTube('OL7PsG18C8Y');

setTimeout(() => {
  console.log('\nTesting Shorts Video d6NItqKAw8s:');
  testInnerTube('d6NItqKAw8s');
}, 2000);
