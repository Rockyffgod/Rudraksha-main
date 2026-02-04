
import React, { useState, useEffect } from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  type?: 'typewriter' | 'stagger' | 'glitch';
}

export const TextReveal: React.FC<TextRevealProps> = ({ 
  text, 
  className = "", 
  delay = 0,
  type = 'stagger'
}) => {
  if (type === 'typewriter') {
    return (
      <div 
        className={`overflow-hidden whitespace-nowrap animate-typewriter ${className}`}
        style={{ 
          animationDelay: `${delay}ms`,
          width: 'fit-content'
        }}
      >
        {text}
        <style>{`
          @keyframes typewriter {
            from { width: 0; }
            to { width: 100%; }
          }
          .animate-typewriter {
            animation: typewriter 2s steps(40, end) forwards;
          }
        `}</style>
      </div>
    );
  }

  // Stagger Effect (Default)
  const letters = text.split("");
  
  return (
    <div className={`flex flex-wrap justify-center ${className}`}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards"
          style={{
            animationDelay: `${delay + (index * 50)}ms`,
            animationDuration: '0.6s',
            animationTimingFunction: 'cubic-bezier(0.2, 0.65, 0.3, 0.9)',
            minWidth: letter === " " ? "0.3em" : "0"
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

interface TypewriterLoopProps {
  words: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export const TypewriterLoop: React.FC<TypewriterLoopProps> = ({ 
  words, 
  className = "",
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 1500
}) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [speed, setSpeed] = useState(typingSpeed);

  useEffect(() => {
    const handleType = () => {
      const i = loopNum % words.length;
      const fullText = words[i];

      setCurrentText(isDeleting 
        ? fullText.substring(0, currentText.length - 1) 
        : fullText.substring(0, currentText.length + 1)
      );

      // Determine speed
      if (isDeleting) {
        setSpeed(deletingSpeed);
      } else {
        setSpeed(typingSpeed);
      }

      if (!isDeleting && currentText === fullText) {
        // Finished typing word, pause before deleting
        setSpeed(pauseDuration);
        setIsDeleting(true);
      } else if (isDeleting && currentText === '') {
        // Finished deleting, move to next word
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setSpeed(500); // Short pause before typing next
      }
    };

    const timer = setTimeout(handleType, speed);
    return () => clearTimeout(timer);
  }, [currentText, isDeleting, loopNum, words, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={`${className} inline-block min-h-[1.2em]`}>
      {currentText}
    </span>
  );
};
