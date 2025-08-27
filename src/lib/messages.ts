
const messages: Record<string, string[]> = {
    welcome: [
        "Let's create something magical! ✨",
        "Ready to build a new world? 🌍",
        "Your canvas is ready. Let's get started! 🎨",
    ],
    random: [
        "What a beautiful creation! 💖",
        "Every tile tells a story. 📖",
        "You're doing an amazing job! 🌟",
        "Keep up the fantastic work! 👍",
        "This is looking great! ✨",
        "Pixel by pixel, a world is born. 🏞️",
        "Such creativity! 🤩",
        "Remember to save your masterpiece! 💾",
        "I love what you're making! 😊",
        "Is it time for a tea break yet? 🍵",
        "Don't be afraid to experiment! 🧪",
        "The details make the difference. 🧐",
        "Looking good! What's next? 🤔",
        "Art is never finished, only abandoned... but this is close! 😉",
        "Wow, just... wow! 🤯",
        "This map has so much character! 💖",
        "I can't wait to see this finished! 🎉",
        "You have a real knack for this! 🏆",
        "Let your imagination run wild! 🦄",
        "That's a clever tile placement! 💡",
        "This is so relaxing, isn't it? 😌",
        "Building worlds is hard work, but you make it look easy! 💪",
        "Believe in your pixels. ✨",
        "Art washes away from the soul the dust of everyday life. - Picasso 🎨",
    ],
    save: [
        "Project saved safely! 💾",
        "Your masterpiece is secure. ✨",
        "Saved! Your progress is protected. 🛡️",
    ],
    clear: [
        "A fresh canvas awaits! 🎨",
        "Ready for a new idea! ✨",
        "Clean slate protocol, engaged! 🚀",
    ],
    clearPalette: [
        "A whole new beginning! ✨",
        "Palette cleared. So many possibilities! 🌈",
        "Starting fresh! What will you create? 🤔",
    ],
    import: [
        "New tiles have arrived! 📥",
        "Welcome, new little tiles! 👋",
        "Your palette just got an upgrade! 🚀",
    ],
    export: [
        "And... it's out in the world! 📤",
        "Assets exported successfully! 📦",
        "Your creation is ready for its next adventure! 🗺️",
    ],
    undo: [
        "Whoops! Let's try that again. 😉",
        "Good catch! Stepping back. ⏪",
        "No worries, that's what undo is for! 😅",
    ],
    redo: [
        "Back to the future! ⚡",
        "Let's stick with that one! ⏩",
        "Redo it to a-do it! ✨",
    ],
    copy: [
        "Copied to clipboard! 📋",
        "Ready to paste! ✨",
        "Got it! Where to next? 🤔",
    ],
    paste: [
        "Pasted! It's like magic. ✨",
        "And... placed! Looks great. 👍",
        "Voilà! Pasted perfectly. 🪄",
    ],
    deleteTile: [
        "Poof! That tile is gone. 💨",
        "One less tile, more room for creativity! 🎨",
    ],
    reorder: [
        "Tiles shuffled successfully! 🃏",
        "A new order for a new day! ✨",
    ],
    resize: [
        "A bigger (or smaller) world! 🌍",
        "Map resized! More space for adventure. 🗺️",
    ],
    layer: [
        "A new layer of possibility! 겹",
        "Layers add so much depth! ✨",
    ],
    merge: [
        "All together now! 🤝",
        "Layers merged into one! ✨",
    ],
    fill: [
        "Splash! The area is filled. 🌊",
        "Fill 'er up! ⛽",
    ],
    tool_brush: ["The classic brush! Let's paint. 🎨"],
    tool_eraser: ["Time to make some space. 💨"],
    tool_picker: ["Find that perfect tile! 🧐"],
    tool_fill: ["Fill it all in! 🌊"],
    tool_shape: ["Let's get geometric! 📐"],
    tool_select: ["Let's grab a section.  lasso"],
    tool_spray: ["A little sprinkle here and there... ✨"],
    tool_gradient: ["Blending beautifully! 🎨"],
    tool_noise: ["A little beautiful chaos. 🎲"],
    tool_magic_wand: ["Abra-ca-dabra! ✨"],
    tool_scatter: ["A delightful mess! 🎲"],
    tool_auto_tile: ["The magic of auto-tiling! 🪄"],
    tool_pan: ["Let's have a look around. 👀"],
};

export const getRandomMessage = (): string => {
    const randomMessages = messages.random;
    return randomMessages[Math.floor(Math.random() * randomMessages.length)];
};

export const getMessage = (key: string): string => {
    const messageList = messages[key] || messages.random;
    return messageList[Math.floor(Math.random() * messageList.length)];
};

    