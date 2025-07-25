'use client';

import React, { useMemo } from 'react';

interface WordCloudProps {
  words: { text: string; count: number }[];
  width?: number;
  height?: number;
}

const WordCloud: React.FC<WordCloudProps> = ({ words, width = 800, height = 400 }) => {
  const processedWords = useMemo(() => {
    if (!words || words.length === 0) return [];

    // Sort words by count and take top 50
    const sortedWords = words
      .filter(word => word.text.length > 2) // Filter out very short words
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    const maxCount = Math.max(...sortedWords.map(w => w.count));
    const minCount = Math.min(...sortedWords.map(w => w.count));

    // Generate colors
    const colors = [
      '#8B5CF6', // Purple
      '#10B981', // Green  
      '#F59E0B', // Orange/Yellow
      '#EF4444', // Red
      '#3B82F6', // Blue
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6366F1', // Indigo
      '#F97170', // Rose
      '#14B8A6', // Teal
    ];

    return sortedWords.map((word, index) => {
      // Calculate font size based on count (between 12px and 48px)
      const fontSize = Math.max(12, Math.min(48, 12 + (word.count - minCount) / (maxCount - minCount) * 36));
      
      // Assign color
      const color = colors[index % colors.length];

      // Generate random position within bounds
      const x = Math.random() * (width - fontSize * word.text.length * 0.6);
      const y = Math.random() * (height - fontSize);

      return {
        ...word,
        fontSize,
        color,
        x: Math.max(10, Math.min(x, width - 100)),
        y: Math.max(fontSize, Math.min(y, height - 10)),
      };
    });
  }, [words, width, height]);

  if (!words || words.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500"
        style={{ width, height }}
      >
        No text data available for word cloud
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <svg width={width} height={height} className="absolute inset-0">
        {processedWords.map((word, index) => (
          <text
            key={`${word.text}-${index}`}
            x={word.x}
            y={word.y}
            fontSize={word.fontSize}
            fill={word.color}
            fontWeight={word.count > 3 ? 'bold' : 'normal'}
            fontFamily="system-ui, -apple-system, sans-serif"
            className="cursor-pointer transition-all duration-200 hover:opacity-75"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            <title>{`${word.text} (${word.count} mentions)`}</title>
            {word.text}
          </text>
        ))}
      </svg>
    </div>
  );
};

export default WordCloud;
