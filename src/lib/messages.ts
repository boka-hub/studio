
const messages: Record<string, string[]> = {
    welcome: [
        "Alright, let's make some pixel magic. Or a mess. Either is fine. ✨",
        "Your personal tile goblin, at your service. Let's start clicking.  goblin",
        "TileForge is fired up! Try not to crash it on the first day. 😉",
    ],
    random: [
        "Is it a feature or a bug? Only one way to find out. 🐛",
        "This looks... intentional. Yeah, let's go with that. 🤔",
        "Are we making art or just clicking randomly? The line is wonderfully blurry. 🎨",
        "You know, a bigger brush might be faster. Or messier. Let's try it. 🖌️",
        "Blink if you need a snack break. 🍪",
        "I'm not saying it's perfect, but I'm also not *not* saying it. 🤫",
        "I see what you did there. Clever. Very clever. 👀",
        "If you mess up, just call it 'abstract'. Works every time. 🖼️",
        "I'm just a humble footer message, but that looks pretty neat. 💖",
        "Remember to stretch your fingers. World-building is hard work! 💪",
        "This is your world. You can put a happy little tree wherever you want. Or a volcano. 🌋",
        "Let's be real, the undo button is the real MVP here. 🏆",
        "Just a few more pixels... or a few hundred. Who's counting? 🤷",
        "This is way more productive than scrolling social media. Probably. 📱",
    ],
    save: [
        "Saved! Your genius is safe from your next 'creative' idea. 💾",
        "Progress locked in. Let's hope it was a good idea! 🤞",
        "Consider it saved. Now, back to the glorious mess-making. 🎨",
    ],
    clear: [
        "Annnnd it's gone. A fresh slate for new mistakes! ✨",
        "Who needs that old map anyway? Let's make a new one! 🗺️",
        "Map cleared. The possibilities are endless, and slightly terrifying. 😱",
    ],
    clearPalette: [
        "Palette wiped. It's so clean I could cry. 😭",
        "Starting from scratch! Are you sure you wanted to do that? 🤔",
        "A blank palette... a bold choice. I like it. 🔥",
    ],
    import: [
        "New tiles have entered the arena! Let the games begin. 🎮",
        "Ooh, shiny new toys for the palette! ✨",
        "Your palette just got a glow-up. Work it. 💅",
    ],
    export: [
        "Unleashed into the wild! Your creation is free! 🕊️",
        "Exported! Go on, show it off. You deserve it. 뽐",
        "Files are packed and ready to go. Don't forget to write. 💌",
    ],
    undo: [
        "Whoopsie-daisy! Let's pretend that never happened. 🤫",
        "I saw nothing. Absolutely nothing. 🙈",
        "A wise choice. That was... questionable. 🤔",
    ],
    redo: [
        "We're back, baby! Let's do this! 🚀",
        "You were right the first time! Or maybe the second. Who knows! 🤷",
        "Okay, okay, I'll put it back. Sheesh. 🙄",
    ],
    copy: [
        "Copied! I've got it, don't worry. Probably. 📋",
        "It's on the clipboard. Try not to copy anything else for a sec. 😅",
    ],
    paste: [
        "Bloop. There it is. ✨",
        "Look what the clipboard dragged in. 🐈",
        "Pasted. It's like it was always meant to be there. Or not. You decide. 🤔",
    ],
    deleteTile: [
        "Poof! Gone. Reduced to atoms. 💨",
        "That tile has been yeeted into the void. 👋",
    ],
    reorder: [
        "Did a little shuffle. Hope you like the new order! 🃏",
        "Reordered! It's like alphabetizing, but with more pictures. 🖼️",
    ],
    resize: [
        "Map resized! Now with more (or less) room for activities! 🤸",
        "New size, who dis? 🗺️",
    ],
    layer: [
        "A new layer! Let's stack it up! 🥞",
        "Things just got a little more complex. I like it. 😏",
    ],
    merge: [
        "Squish! All your layers are one now. Hope that was intentional. 🤞",
        "It's like a layer casserole. Deliciously flat. 🍲",
    ],
    fill: [
        "Splash! It's all one color now. Hope you picked a good one! 🎨",
        "The bucket has spoken. 🌊",
    ],
    tool_brush: ["Ah, the classic. Let's paint the town... or at least this canvas. 🖌️"],
    tool_eraser: ["Time to erase some of those 'happy accidents'. 🤫"],
    tool_picker: ["What's this one? Ooh, I like that one. Let's use it! 👉"],
    tool_fill: ["Feeling lazy, are we? Let's just flood the whole area. 🌊"],
    tool_shape: ["Time for some clean lines. Let's make geometry proud. 📐"],
    tool_select: ["Let's grab a chunk of this masterpiece. Lasso up! 🤠"],
    tool_spray: ["For that 'I tried, but not too hard' look. It's called style. ✨"],
    tool_gradient: ["Let's get fancy and blend things. So sophisticated. 🧐"],
    tool_noise: ["Let's make a beautiful, chaotic mess. It's my favorite. 🎲"],
    tool_magic_wand: ["You're a wizard, Harry! Or at least you have a magic wand. ✨"],
    tool_scatter: ["Let's throw some tiles around and see what sticks. 🎲"],
    tool_auto_tile: ["The lazy person's best friend. Let the magic begin! 🪄"],
    tool_pan: ["Let's take a little scroll and admire your work. Or find mistakes. 👀"],
};

export const getRandomMessage = (): string => {
    const randomMessages = messages.random;
    return randomMessages[Math.floor(Math.random() * randomMessages.length)];
};

export const getMessage = (key: string): string => {
    const messageList = messages[key] || messages.random;
    return messageList[Math.floor(Math.random() * messageList.length)];
};
