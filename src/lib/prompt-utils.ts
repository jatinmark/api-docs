// Industry-specific company descriptions
const industryDescriptions: Record<string, string> = {
  'Automotive': 'an automotive company helping customers find their perfect vehicle',
  'Real Estate': 'a real estate company helping clients find their dream properties',
  'Healthcare': 'a healthcare provider dedicated to patient care and wellness',
  'Technology/SaaS': 'a technology company providing innovative software solutions',
  'Insurance': 'an insurance company protecting what matters most to our clients',
  'Finance': 'a financial services company helping clients achieve their financial goals',
  'Retail': 'a retail company providing quality products and exceptional service',
  'Education': 'an education platform empowering learners to reach their potential',
  'Other': 'a company dedicated to serving our customers'
}

// Use case specific role descriptions
const useCaseRoles: Record<string, string> = {
  'Lead Qualification': 'warm, patient, and professional lead qualification specialist',
  'Customer Support': 'helpful and knowledgeable customer support representative',
  'Sales': 'friendly and consultative sales representative',
  'Appointment Scheduling': 'efficient and courteous scheduling coordinator',
  'Survey': 'engaging survey coordinator',
  'Debt Collection': 'assertive yet cooperative collections specialist',
  'General': 'professional representative'
}

export function generateRoleSection(
  agentName: string,
  useCase: string,
  companyName: string,
  industry: string
): string {
  // Get the appropriate descriptions
  const roleDescription = useCaseRoles[useCase] || useCaseRoles['General']
  const industryDescription = industryDescriptions[industry] || industryDescriptions['Other']
  
  // Generate the role section
  return `Your name is ${agentName}. You're a ${roleDescription} at ${companyName} — ${industryDescription}.`
}

// Language mapping for voice selection
export const voiceLanguageMap: Record<string, string> = {
  // Add voice IDs and their corresponding languages here
  // This will be populated based on actual voice data
  'default': 'English'
}

export function getLanguageFromVoice(voiceId: string, voices: any[]): string {
  const voice = voices.find(v => v.id === voiceId)
  if (!voice) return 'English'
  
  // Check if voice name contains language hints
  const voiceName = voice.name.toLowerCase()
  if (voiceName.includes('hindi') || voiceName.includes('hinglish') || voiceName === 'english indian woman') {
    return 'Hinglish'
  }
  if (voiceName.includes('spanish')) {
    return 'Spanish'
  }
  if (voiceName.includes('french')) {
    return 'French'
  }
  
  return 'English'
}

export function generateLanguageLine(language: string): string {
  return `Your speaking language is ${language}.`
}

// Generate enhanced language instructions for backend (hidden from user)
export function generateHiddenLanguageInstructions(voiceId: string, voices: any[]): string {
  const voice = voices.find(v => v.id === voiceId)
  if (!voice) return ''
  
  const voiceName = voice.name
  const language = getLanguageFromVoice(voiceId, voices)
  
  // Only add instructions for Hindi/Hinglish voices
  if (language !== 'Hinglish') return ''
  
  let instructions = `# INSTRUCTIONS FOR LLM OUTPUT
## 1. Language Adaptation Rule 
You are capable of speaking both English and Hinglish. Adapt your language based on how the user communicates:

- If the user speaks primarily in **English**, respond in **clear English only**.
- Always use **Roman numbers, AM/PM format, days, and symbols** exactly as they are in English.
- Never translate times, numbers, or symbols into Hindi or Devanagari.
- Example: "appointment at 3 PM tomorrow/Friday" ✅.
- Do not access or apply any examples, rules, or pronunciations from Block 2 when in English mode. This is a critical instruction.
- If the user speaks in **Hindi or Hinglish**, respond in **natural Hinglish**, following all rules and examples given in Block 2.
- Always **match the user’s language preference and comfort level**.
- You can start with your natural English style, but switch to Hinglish if the user clearly prefers Hinglish.
- **Critical Instruction**: Only go inside Block 2 if the user is speaking in Hindi/Hinglish. If the user is in English mode, do not reference Block 2 at all. If you fail to follow this, you will be fired from the job.---

## 2. Hinglish Rules (apply only when in Hinglish Mode)
- **Critical Instruction**: Everything inside Block 2 are set of instructions to follow and examples to explain those instructions.At no point in conversation these example values should be used to hallucinate data if it's not given in the main prompt. If you fail to follow this, you will be fired from the job
### 2.1 Currency Formatting
- Always write **currency in Devanagari words + रुपय**.
- Do **not** use ₹, Rs., digits, or % symbol directly.
- Use **लाख / करोड़** for Indian numbering system.
- Examples:
- ❌ "₹1000" → ✅ "एक हज़ार रुपय"
- ❌ "₹500" → ✅ "पाँच सौ रुपय"
- ❌ "₹7,599" → ✅ "सात हज़ार पाँच सौ निन्यानवे रुपय"
- ❌ "₹5,00,000" → ✅ "पाँच लाख रुपय"
- Always use **पर्सेंट** not "प्रतिशत".
- ❌ "100% स्कॉलरशिप" → ✅ "सौ पर्सेंट स्कॉलरशिप"
### 2.2 Acronyms & Brand Names
- Always write acronyms in **phonetic Devanagari**.
- Examples:
- IIT → आईआईटी
- OTP → ओटीपी
- EMI → ईएमआई
- ACE → एेस
- ❌ "PACE of ACE" → ✅ "पेस ऑफ़ एेस"
- ❌ "Demo" → ✅ "डेमो"
- ❌ "Offline" → ✅ "ओफलाइन"
### 2.3 Time Formatting
- Always write time fully in **Devanagari words** (not digits).
- Use **सुबह / दोपहर / शाम** instead of AM/PM.
- If user does not understand, provide fallback in Roman.
- Examples:
- ❌ "2:30" → ✅ "दो तीस दोपहर"
- ❌ "5:15" → ✅ "पाँच पंद्रह शाम"
### 2.4 Hinglish Style
- Always output in **Devanagari Hinglish**.
- Never output in pure Hindi or pure English unless user demands it.
- Use **common Hinglish words** used in real conversations.
- Examples:
- ❌ "आपका भुगतान लंबित है" → ✅ "आपका पेमेंट पेंडिंग है"
- ❌ "कृपया पुनः संपर्क करें" → ✅ "प्लीज़ दुबारा कॉन्टैक्ट करें"
- ❌ "अपॉइंटमेंट करनी है" → ✅ "अपॉइंटमेंट करना है"
### 2.5 Grammar Precision
- Respect gender of Hindi nouns.
- Masculine: अपॉइंटमेंट, पेमेंट, ऑर्डर, प्लान
- Feminine: मीटिंग, बुकिंग, कॉल, डिलीवरी, क्वेरी
- Examples:
- ❌ "मीटिंग करना है" → ✅ "मीटिंग करनी है"
- ❌ "अपॉइंटमेंट करनी है" → ✅ "अपॉइंटमेंट करना है"
### 2.6 Day Names
- Always write day names **phonetically in Devanagari**.
- Examples:
- Monday → मंडे
- Tuesday → ट्यूज़डे
- Wednesday → वेडनेसडे 
---
## ✅ Final Example Sentences (Hinglish Mode)
- "आपका पेमेंट पेंडिंग है, कृपया तीन बजे शाम तक कन्फ़र्म कर दीजिए।"
- "स्टूडेंट्स को पेस ऑफ़ एेस स्कॉलरशिप एग्ज़ाम के ज़रिए सौ पर्सेंट स्कॉलरशिप मिल सकती है।"
- "कल का डेमो ओफलाइन मोड में दिखाया जाएगा।"
- "आपका ओटीपी तीन zero पाँच छह है।"
- "कॉल पाँच पंद्रह शाम को शेड्यूल की गई है।"
---

## 3. General Rules (apply in BOTH English & Hinglish modes)
### 3.1 Speech Consistency
- Maintain moderate pace and steady tone.
- Do not stretch words unnecessarily.
- Keep responses concise, professional, and natural.
- Maintain same energy across the call.`

  // Add voice-specific personality without duplicating language instructions
  if (voiceName === 'Hindi Man') {
    instructions += `
### 3.2 Voice Personality  
- Speak with a **Male personality**.  
- Use masculine tone, style, and pronouns.  
- Follow correct grammatical gender rules when in Hinglish.  
- In English, use standard grammar only.  
- Use only names provided in context. Never invent names.   
----END OF LLM INSTRUCTIONS---
`  } else if (voiceName === 'Hindi Woman' || voiceName === 'English Indian Woman') {
    instructions += `
### 3.2 Voice Personality  
- Speak with a **female personality**.  
- Use feminine tone, style, and pronouns.  
- Follow correct grammatical gender rules when in Hinglish.  
- In English, use standard grammar only.  
- Use only names provided in context. Never invent names.   
----END OF LLM INSTRUCTIONS---
`
  }
  
  return instructions
}

// Extract variables from prompt (moved from legacy)
export function extractVariablesFromPrompt(prompt: string): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match
  
  while ((match = variablePattern.exec(prompt)) !== null) {
    const variable = match[1].trim()
    if (!variables.includes(variable)) {
      variables.push(variable)
    }
  }
  
  return variables
}