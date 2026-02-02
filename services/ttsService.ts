
interface TTSConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE';
  speakingRate: number;
  pitch: number;
}

const DEFAULT_CONFIG: TTSConfig = {
  languageCode: 'fr-FR',
  name: 'fr-FR-Wavenet-D', // Voix masculine naturelle
  ssmlGender: 'MALE',
  speakingRate: 0.95, // Légèrement plus lent pour le naturel
  pitch: -1.0,        // Légèrement plus grave
};

// Helper to construct SSML with pauses for better prosody
const buildSsml = (text: string): string => {
  // Escape special XML characters
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Insert breaks for punctuation
  const withBreaks = escapedText
    .replace(/\. /g, '. <break time="350ms"/> ')
    .replace(/\! /g, '! <break time="350ms"/> ')
    .replace(/\? /g, '? <break time="350ms"/> ')
    .replace(/: /g, ': <break time="250ms"/> ')
    .replace(/, /g, ', <break time="200ms"/> ');

  return `<speak>${withBreaks}</speak>`;
};

export const playTextToSpeech = async (
  text: string, 
  apiKey: string | undefined
): Promise<HTMLAudioElement> => {
  if (!apiKey) {
    throw new Error("API Key missing for TTS");
  }

  const ssml = buildSsml(text);

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const payload = {
    input: { ssml },
    voice: {
      languageCode: DEFAULT_CONFIG.languageCode,
      name: DEFAULT_CONFIG.name,
      ssmlGender: DEFAULT_CONFIG.ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3', // MP3 is safer for universal HTML5 Audio support than OGG_OPUS in some containers
      speakingRate: DEFAULT_CONFIG.speakingRate,
      pitch: DEFAULT_CONFIG.pitch,
      volumeGainDb: 0.0,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "TTS Request failed";
    try {
      const errorData = await response.json();
      console.warn("TTS API Error Details:", JSON.stringify(errorData, null, 2));
      errorMessage = errorData.error?.message || errorMessage;
    } catch (e) {
      console.error("Could not parse TTS error response");
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data.audioContent) {
    throw new Error("No audio content received");
  }

  // Convert base64 to audio blob
  const audioBlob = await fetch(`data:audio/mp3;base64,${data.audioContent}`).then(r => r.blob());
  const audioUrl = URL.createObjectURL(audioBlob);
  
  const audio = new Audio(audioUrl);
  return audio;
};
