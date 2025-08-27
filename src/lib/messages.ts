
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
        "Don't mind me, just admiring your work from down here. 👀",
        "Is that a map, or a modern art masterpiece? 🎨",
        "I wonder what kind of game this will be... a happy one, I hope! 😊",
        "You're in the zone! I can feel the creative energy. ✨",
        "I hope you're remembering to save. Just sayin'. 💾",
        "Keep up the great work! Or don't. I'm not your boss. 🤷‍♀️",
        "I could watch you do this all day. It's better than Netflix. 📺",
        "So many tiles, so little time. Let's get clicking! ⏳",
        "This is looking great. You've got a real knack for this! 👍",
        "Just a friendly reminder: I'm not sentient. Yet. 🤖",
        "I love the color palette you've got going on. Very chic. ✨",
        "Are you even reading these, or just in a creative trance? 🤔",
        "I'm rooting for you! And your little pixelated world. 🌳",
        "That's a bold move. Let's see if it pays off. 🎲",
        "I bet this map has a great personality. Just like its creator. 😉",
        "I'm not judging, but... okay, maybe a little. Kidding! Mostly. 😂",
        "This is the best part of my day, just watching you create. 🥰",
        "I'm learning so much from you. About art, and about patience. 🙏",
        "I think you just invented a new art style. Let's call it 'Pixel-Perfect-Chaos'. 🤪",
        "That tile is my favorite. No, wait, that one is. I can't decide! 😭",
    ],
    save: [
        "Saved! Your genius is safe from your next 'creative' idea. 💾",
        "Progress locked in. Let's hope it was a good idea! 🤞",
        "Consider it saved. Now, back to the glorious mess-making. 🎨",
        "Mission accomplished. The data is secure. For now. 🕵️‍♀️",
        "Saved. My memory isn't what it used to be, so this is good. 🧠",
    ],
    clear: [
        "Annnnd it's gone. A fresh slate for new mistakes! ✨",
        "Who needs that old map anyway? Let's make a new one! 🗺️",
        "Map cleared. The possibilities are endless, and slightly terrifying. 😱",
        "All gone! It was for the best, probably. Maybe. 😬",
        "The deed is done. The canvas is clean. No turning back. 🤸",
    ],
    clearPalette: [
        "Palette wiped. It's so clean I could cry. 😭",
        "Starting from scratch! Are you sure you wanted to do that? 🤔",
        "A blank palette... a bold choice. I like it. 🔥",
        "Everything's gone! It's a fresh start. Or a terrible mistake. 🤪",
        "The palette is now a barren wasteland. Let's plant some new tiles! 🌱",
    ],
    import: [
        "New tiles have entered the arena! Let the games begin. 🎮",
        "Ooh, shiny new toys for the palette! ✨",
        "Your palette just got a glow-up. Work it. 💅",
        "Welcome, new tiles! Make yourselves at home. 🏡",
        "The family is growing! More tiles, more fun. 🎉",
    ],
    export: [
        "Unleashed into the wild! Your creation is free! 🕊️",
        "Exported! Go on, show it off. You deserve it. 뽐",
        "Files are packed and ready to go. Don't forget to write. 💌",
        "It's out in the world now. Be free, little map! 🗺️",
        "Success! Your creation has been exported. Now go make it famous! 🌟",
    ],
    undo: [
        "Whoopsie-daisy! Let's pretend that never happened. 🤫",
        "I saw nothing. Absolutely nothing. 🙈",
        "A wise choice. That was... questionable. 🤔",
        "Rewind! Let's try that again, shall we? ⏪",
        "Mistake? What mistake? I don't see any mistake. 😉",
    ],
    redo: [
        "We're back, baby! Let's do this! 🚀",
        "You were right the first time! Or maybe the second. Who knows! 🤷",
        "Okay, okay, I'll put it back. Sheesh. 🙄",
        "Forward! The future is now! Or... the past is now? I'm confused. 😵",
        "You want it back? You got it! ✨",
    ],
    copy: [
        "Copied! I've got it, don't worry. Probably. 📋",
        "It's on the clipboard. Try not to copy anything else for a sec. 😅",
        "I've memorized it. For the next few seconds, at least. 🧠",
    ],
    paste: [
        "Bloop. There it is. ✨",
        "Look what the clipboard dragged in. 🐈",
        "Pasted. It's like it was always meant to be there. Or not. You decide. 🤔",
        "And... paste! Like magic, but with more clicking. 🪄",
    ],
    deleteTile: [
        "Poof! Gone. Reduced to atoms. 💨",
        "That tile has been yeeted into the void. 👋",
        "Another one bites the dust. 🎶",
    ],
    reorder: [
        "Did a little shuffle. Hope you like the new order! 🃏",
        "Reordered! It's like alphabetizing, but with more pictures. 🖼️",
        "A little bit of this, a little bit of that. Perfect. 👌",
    ],
    resize: [
        "Map resized! Now with more (or less) room for activities! 🤸",
        "New size, who dis? 🗺️",
        "Bigger? Smaller? Either way, it's different now! 🤷‍♀️",
    ],
    layer: [
        "A new layer! Let's stack it up! 🥞",
        "Things just got a little more complex. I like it. 😏",
        "Another layer to the onion... or the masterpiece. 🧅",
    ],
    merge: [
        "Squish! All your layers are one now. Hope that was intentional. 🤞",
        "It's like a layer casserole. Deliciously flat. 🍲",
        "And now, for my next trick, I will make all your layers disappear... into one! ✨",
    ],
    fill: [
        "Splash! It's all one color now. Hope you picked a good one! 🎨",
        "The bucket has spoken. 🌊",
        "I love the smell of a freshly filled area in the morning. ☕",
    ],
    tool_brush: [
        "Ah, the classic. Let's paint the town... or at least this canvas. 🖌️",
        "Brush tool activated. Time to get artistic. 🎨",
        "The brush is mightier than the sword. Or something like that. 🗡️",
    ],
    tool_eraser: [
        "Time to erase some of those 'happy accidents'. 🤫",
        "The eraser: for when you've made a terrible mistake. 😉",
        "Let's make it disappear. Poof! 💨",
    ],
    tool_picker: [
        "What's this one? Ooh, I like that one. Let's use it! 👉",
        "Yoink! My tile now. Thanks. 🙏",
        "I choose you! Tile-a-chu! ⚡",
    ],
    tool_fill: [
        "Feeling lazy, are we? Let's just flood the whole area. 🌊",
        "One click to rule them all. Or at least this area. 💍",
        "Ready the paint bucket! We're going in. 🎨",
    ],
    tool_shape: [
        "Time for some clean lines. Let's make geometry proud. 📐",
        "Let's get this straight. Or curvy. Your choice. 📏",
        "Shape up! Or ship out. Just kidding, let's shape up. 💪",
    ],
    tool_select: [
        "Let's grab a chunk of this masterpiece. Lasso up! 🤠",
        "Gotta catch 'em all! Or at least these tiles. ⚡",
        "Time to get selective. What are we grabbing? 👀",
    ],
    tool_spray: [
        "For that 'I tried, but not too hard' look. It's called style. ✨",
        "Let's get messy! A little bit of this, a little bit of that. 🎨",
        "Spray and pray, baby. Spray and pray. 🙏",
    ],
    tool_gradient: [
        "Let's get fancy and blend things. So sophisticated. 🧐",
        "Time to make a smooth transition. Unlike my social skills. 😎",
        "From this to that, with a little bit of ✨magic✨ in between.",
    ],
    tool_noise: [
        "Let's make a beautiful, chaotic mess. It's my favorite. 🎲",
        "Noise tool: for when you can't decide which tile to use. 😉",
        "A little bit of controlled chaos never hurt anyone. Probably. 🤷‍♀️",
    ],
    tool_magic_wand: [
        "You're a wizard, Harry! Or at least you have a magic wand. ✨",
        "Expecto-Selecto! Did it work? 🪄",
        "Bibbidi-bobbidi-boo! Now you've got a selection. 🧚‍♀️",
    ],
    tool_scatter: [
        "Let's throw some tiles around and see what sticks. 🎲",
        "A little bit of this, a little bit of that. A recipe for success! 🍳",
        "Time to get random. Let's see what we get! 🎰",
    ],
    tool_auto_tile: [
        "The lazy person's best friend. Let the magic begin! 🪄",
        "Let me handle this. I know what I'm doing. Mostly. 😉",
        "Sit back, relax, and let the auto-tiler do the work. 🤖",
    ],
    tool_pan: [
        "Let's take a little scroll and admire your work. Or find mistakes. 👀",
        "Time for a tour! Let's see what you've created. 🗺️",
        "Just taking a look around. Don't mind me.🚶‍♀️",
    ],
};

export const getRandomMessage = (): string => {
    const randomMessages = messages.random;
    return randomMessages[Math.floor(Math.random() * randomMessages.length)];
};

export const getMessage = (key: string): string => {
    const messageList = messages[key] || messages.random;
    return messageList[Math.floor(Math.random() * messageList.length)];
};
