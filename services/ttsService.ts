
interface TTSConfig {
  languageCode: string;
  name: string;
  ssmlGender: 'MALE' | 'FEMALE';
  speakingRate: number;
  pitch: number;
}

const VOICE_CONFIGS: Record<string, TTSConfig> = {
  fr: {
    languageCode: 'fr-FR',
    name: 'fr-FR-Wavenet-D', // Voix masculine naturelle
    ssmlGender: 'MALE',
    speakingRate: 0.95,
    pitch: -1.0,
  },
  en: {
    languageCode: 'en-US',
    name: 'en-US-Journey-D', // Natural male voice for consistency
    ssmlGender: 'MALE',
    speakingRate: 1.0,
    pitch: 0.0,
  }
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
  apiKey: string | undefined,
  language: 'fr' | 'en' = 'fr'
): Promise<HTMLAudioElement> => {
  if (!apiKey) {
    throw new Error("API Key missing for TTS");
  }

  const ssml = buildSsml(text);
  const config = VOICE_CONFIGS[language] || VOICE_CONFIGS.fr;

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const payload = {
    input: { ssml },
    voice: {
      languageCode: config.languageCode,
      name: config.name,
      ssmlGender: config.ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3', // MP3 is safer for universal HTML5 Audio support than OGG_OPUS in some containers
      speakingRate: config.speakingRate,
      pitch: config.pitch,
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
