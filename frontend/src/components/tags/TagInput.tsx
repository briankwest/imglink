import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { useDebounce } from '../../hooks/useDebounce';

interface TagInputProps {
  onAddTag: (tag: string) => void;
  existingTags: string[];
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

interface TagSuggestion {
  id: number;
  name: string;
  slug: string;
  usage_count: number;
}

const TagInput: React.FC<TagInputProps> = ({
  onAddTag,
  existingTags,
  maxTags = 10,
  placeholder = 'Add a tag...',
  className = ''
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const debouncedInput = useDebounce(input, 300);

  // Fetch tag suggestions
  useEffect(() => {
    if (debouncedInput.length > 0) {
      setLoading(true);
      apiService.get<TagSuggestion[]>(`/api/v1/tags/search?q=${encodeURIComponent(debouncedInput)}&limit=10`)
        .then(data => {
          // Filter out already added tags
          const filtered = (data || []).filter(
            (tag: TagSuggestion) => !existingTags.includes(tag.name)
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        })
        .catch(error => {
          console.error('Error fetching tag suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        })
        .finally(() => setLoading(false));
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedInput, existingTags]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleAddTag(suggestions[selectedIndex].name);
      } else if (input.trim()) {
        handleAddTag(input.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    
    // Validate tag
    if (!cleanTag) return;
    if (cleanTag.length > 50) {
      alert('Tag must be 50 characters or less');
      return;
    }
    if (!/^[\w\s-]+$/.test(cleanTag)) {
      alert('Tag can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }
    if (existingTags.includes(cleanTag)) {
      alert('Tag already added');
      return;
    }
    if (existingTags.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`);
      return;
    }

    onAddTag(cleanTag);
    setInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const remainingTags = maxTags - existingTags.length;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={remainingTags > 0 ? placeholder : 'Maximum tags reached'}
          disabled={remainingTags === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
          {remainingTags}/{maxTags}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
              Loading suggestions...
            </div>
          ) : (
            <>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleAddTag(suggestion.name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-3 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                    index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="opacity-60">#</span>
                    {suggestion.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {suggestion.usage_count} {suggestion.usage_count === 1 ? 'use' : 'uses'}
                  </span>
                </button>
              ))}
              
              {/* Option to create new tag if no exact match */}
              {input.trim() && !suggestions.some(s => s.name === input.trim().toLowerCase()) && (
                <button
                  onClick={() => handleAddTag(input.trim())}
                  onMouseEnter={() => setSelectedIndex(suggestions.length)}
                  className={`w-full px-3 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 ${
                    selectedIndex === suggestions.length ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    Create "{input.trim().toLowerCase()}"
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TagInput;