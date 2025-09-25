import React, { useState, KeyboardEvent } from 'react';

interface EmailListInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  maxEmails?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const EmailListInput: React.FC<EmailListInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add participant email...',
  maxEmails = 50,
  disabled = false,
  className = '',
  error,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) return;

    if (!isValidEmail(trimmedEmail)) {
      setIsValidating(true);
      setTimeout(() => setIsValidating(false), 2000);
      return;
    }

    if (value.includes(trimmedEmail)) {
      setIsValidating(true);
      setTimeout(() => setIsValidating(false), 2000);
      return;
    }

    if (value.length >= maxEmails) {
      setIsValidating(true);
      setTimeout(() => setIsValidating(false), 2000);
      return;
    }

    onChange([...value, trimmedEmail]);
    setInputValue('');
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(value.filter(email => email !== emailToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeEmail(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const emails = pastedText
      .split(/[,\n\s]+/)
      .map(email => email.trim())
      .filter(email => email && isValidEmail(email));

    const newEmails = emails.filter(email => !value.includes(email));
    if (value.length + newEmails.length <= maxEmails) {
      onChange([...value, ...newEmails]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`min-h-[42px] p-2 border rounded-md bg-white flex flex-wrap gap-1 items-center ${
          error
            ? 'border-red-500 focus-within:ring-red-500 focus-within:border-red-500'
            : 'border-gray-300 focus-within:ring-blue-500 focus-within:border-blue-500'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        {/* Email tags */}
        {value.map((email, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none focus:bg-blue-200"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </span>
        ))}

        {/* Input field */}
        <input
          type="email"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled || value.length >= maxEmails}
          className="flex-1 min-w-[200px] border-0 outline-none bg-transparent text-sm placeholder-gray-400 disabled:cursor-not-allowed"
        />
      </div>

      {/* Error message */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Validation feedback */}
      {isValidating && (
        <p className="text-sm text-red-600">
          {value.length >= maxEmails
            ? `Maximum ${maxEmails} participants allowed`
            : 'Please enter a valid email address or remove duplicates'}
        </p>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        Press Enter or comma to add emails. Maximum {maxEmails} participants.
      </p>
    </div>
  );
};
