import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Check, AlertCircle } from 'lucide-react';

interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}

interface AddressSuggestion {
  id: string;
  text: string;
  highlight?: string;
  description?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: Address | null) => void;
  onInputChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onInputChange,
  placeholder = "Enter your delivery address...",
  required = false,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'invalid'>('none');
  const [hasBeenBlurred, setHasBeenBlurred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canada Post API integration - ALWAYS use backend API
  const searchAddresses = async (query: string): Promise<AddressSuggestion[]> => {
    if (query.length < 3) return [];

    try {
      setIsLoading(true);
      
      // Always use backend API - no frontend API key needed
      const response = await fetch(`/api/address/suggest?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        console.error('Address API error:', response.status, response.statusText);
        return []; // Return empty array instead of mock data
      }
      
      const data = await response.json();
      return data.suggestions || [];
      
    } catch (error) {
      console.error('Address API failed:', error);
      return []; // Return empty array instead of mock data
    } finally {
      setIsLoading(false);
    }
  };


  // Parse address string into components
  const parseAddress = (addressString: string): Address => {
    // Simple parsing - in production, use Canada Post's detailed response
    const parts = addressString.split(', ');
    
    return {
      street: parts[0] || '',
      city: parts[1] || 'Ottawa',
      province: parts[2]?.split(' ')[0] || 'ON',
      postalCode: parts[2]?.split(' ').slice(1).join(' ') || '',
      country: 'Canada',
      formattedAddress: addressString
    };
  };

  // Validate Canadian postal code format
  const validatePostalCode = (postalCode: string): boolean => {
    const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
    return canadianPostalCodeRegex.test(postalCode.trim());
  };

  // Handle input changes
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (value && value.length >= 3) {
        const results = await searchAddresses(value);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300); // Debounce API calls

    return () => clearTimeout(delayedSearch);
  }, [value]);

  // Validate address format - only show validation after user interaction
  useEffect(() => {
    if (value && hasBeenBlurred) {
      const parsed = parseAddress(value);
      const hasPostalCode = parsed.postalCode && validatePostalCode(parsed.postalCode);
      const hasStreetAndCity = parsed.street && parsed.city;
      
      if (hasStreetAndCity && hasPostalCode) {
        setValidationStatus('valid');
      } else {
        setValidationStatus('invalid');
      }
    } else {
      setValidationStatus('none');
    }
  }, [value, hasBeenBlurred]);

  // Handle suggestion selection
  const selectSuggestion = async (suggestion: AddressSuggestion) => {
    try {
      // If this is a detailed address ID, try to get full address details
      if (suggestion.id && suggestion.id.includes('|')) {
        const response = await fetch(`/api/address/suggest?id=${encodeURIComponent(suggestion.id)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.fullAddress) {
            onInputChange(data.fullAddress);
            onChange(parseAddress(data.fullAddress));
            setIsOpen(false);
            setSelectedIndex(-1);
            setHasBeenBlurred(true); // Mark as interacted for validation
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error getting full address details:', error);
    }
    
    // Fallback to basic parsing
    const parsedAddress = parseAddress(suggestion.text);
    onInputChange(suggestion.text);
    onChange(parsedAddress);
    setIsOpen(false);
    setSelectedIndex(-1);
    setHasBeenBlurred(true); // Mark as interacted for validation
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <MapPin className="h-4 w-4 text-gray-400" />;
    }
  };

  const getValidationStyles = () => {
    switch (validationStatus) {
      case 'valid':
        return 'border-green-300 focus:border-green-500 focus:ring-green-200';
      case 'invalid':
        return 'border-red-300 focus:border-red-500 focus:ring-red-200';
      default:
        return 'border-gray-300 focus:border-blue-500 focus:ring-blue-200';
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onBlur={() => setHasBeenBlurred(true)}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-10 py-3 border rounded-md transition-colors ${getValidationStyles()}`}
        />
        
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
          ) : (
            getValidationIcon()
          )}
        </div>

        {validationStatus !== 'none' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        )}
      </div>

      {/* Validation message */}
      {validationStatus === 'invalid' && value && (
        <p className="mt-1 text-sm text-red-600">
          Please enter a complete Canadian address with postal code (e.g., K1A 0A6)
        </p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 border-none cursor-pointer ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {suggestion.text}
                  </div>
                  {suggestion.description && (
                    <div className="text-xs text-gray-500">
                      {suggestion.description}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Production address validation */}
    </div>
  );
};