
export const colorNames = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE'];

// Hex codes ordered to match the colorNames array indices for logical consistency
export const colorValues = [
  '#FF3131', // Red
  '#1F51FF', // Blue
  '#39FF14', // Green
  '#FFFF33', // Yellow
  '#BC13FE'  // Purple
];

export interface Challenge {
  displayText: string;
  displayColor: string;
  isMatch: boolean;
}

export const getRandomChallenge = (): Challenge => {
  // 1. Determine if this round should be a match (40% chance)
  const isMatch = Math.random() < 0.4;

  // 2. Select a random index for the text
  const textIndex = Math.floor(Math.random() * colorNames.length);
  let colorIndex;

  if (isMatch) {
    // If it must match, the color index must equal the text index
    colorIndex = textIndex;
  } else {
    // If it must NOT match, pick a random color index that is different from text index
    do {
      colorIndex = Math.floor(Math.random() * colorValues.length);
    } while (colorIndex === textIndex);
  }

  // 3. Return the challenge object
  return {
    displayText: colorNames[textIndex],
    displayColor: colorValues[colorIndex],
    isMatch: isMatch
  };
};
